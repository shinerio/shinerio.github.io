```go
package main

import (
	"context"
	"fmt"
	"log"
	"math/rand"
	"os"
	"os/signal"
	"strconv"
	"sync"
	"syscall"
	"time"

	"github.com/IBM/sarama"
)

const (
	kafka_url         = "dbconn.sealosbja.site:34337"
	topic             = "topic_test1"
	numPartitions     = 4
	consumerGroupName = "my-test-group"
)

var (
	signals = make(chan os.Signal, 1)
)

func main() {
	signal.Notify(signals, syscall.SIGINT, syscall.SIGTERM)
	ctx, cancel := context.WithCancel(context.Background())

	CreateTopic()
	wg := sync.WaitGroup{}
	wg.Add(1)
	go SyncProducer(ctx, &wg)
	wg.Add(1)
	//go SaramaConsumer(ctx, &wg)
	go SaramaConsumerGroup(ctx, &wg)

	<-signals
	cancel()

	wg.Wait()
	log.Println("exit main...")
}

func CreateTopic() error {
	config := sarama.NewConfig()

	admin, err := sarama.NewClusterAdmin([]string{kafka_url}, config)
	if err != nil {
		return err
	}
	defer admin.Close()

	topicDetail := &sarama.TopicDetail{
		NumPartitions: numPartitions,
	}

	admin.CreateTopic(topic, topicDetail, false)
	meta, _ := admin.DescribeTopics([]string{topic})
	log.Print(meta)
	return nil
}

type consumerGroupHandler struct {
}

func (consumerGroupHandler) Setup(sarama.ConsumerGroupSession) error {
	log.Printf("do something before every batch consume...")
	return nil
}

func (consumerGroupHandler) Cleanup(sarama.ConsumerGroupSession) error {
	log.Printf("do something after leave group...")
	return nil
}

// ConsumeClaim must start a consumer loop of ConsumerGroupClaim's Messages().
func (consumerGroupHandler) ConsumeClaim(session sarama.ConsumerGroupSession, claim sarama.ConsumerGroupClaim) error {
	for msg := range claim.Messages() {
		// 在内存中标记消息的处理状态，通常在处理每条消息时调用
		session.MarkMessage(msg, "")
		log.Printf("Message claimed: key = %s, value = %s, timestamp = %v, topic = %s", msg.Key, msg.Value, msg.Timestamp, msg.Topic)
	}

	// 将内存中的标记信息（即消费位移）提交给 Kafka 集群进行持久化。一般在处理完一批消息或者在特定的时机（如消费组会话结束时）调用
	session.Commit()
	return nil
}

// 消费者组
func SaramaConsumerGroup(ctx context.Context, mainWg *sync.WaitGroup) {
	defer mainWg.Done()
	config := sarama.NewConfig()
	config.Consumer.Return.Errors = false
	config.Consumer.Offsets.Initial = sarama.OffsetOldest // 未找到组消费记录时从，最早的消息开始消费
	config.Consumer.Offsets.AutoCommit.Enable = false     // 禁用自动提交

	group, err := sarama.NewConsumerGroup([]string{kafka_url}, consumerGroupName, config)
	if err != nil {
		panic(err)
	}
	defer group.Close()

	// Track errors
	go func() {
		for err := range group.Errors() {
			fmt.Println("ERROR", err)
		}
	}()
	fmt.Println("Consumed start")
	// Iterate over consumer sessions.
	topics := []string{topic}
	handler := consumerGroupHandler{}
	for {
		select {
		case <-ctx.Done():
			return
		default:
			// `Consume` should be called inside an infinite loop, when a
			// server-side rebalance happens, the consumer session will need to be
			// recreated to get the new claims
			err := group.Consume(ctx, topics, handler)
			if err != nil {
				panic(err)
			}
		}
	}
}

func SyncProducer(mainCtx context.Context, mainWg *sync.WaitGroup) {
	defer mainWg.Done()
	config := sarama.NewConfig()
	config.Producer.Return.Successes = true                 // 成功交付的消息将在success channel返回. producer.Successes()
	config.Producer.Return.Errors = true                    // 失败交付的消息将在success channel返回. producer.Errors()
	config.Producer.Partitioner = sarama.NewHashPartitioner // 使用key hash选择partition
	producer, err := sarama.NewAsyncProducer([]string{kafka_url}, config)
	if err != nil {
		panic(err)
	}

	var (
		produceWg                                   sync.WaitGroup
		enqueued, producerSuccesses, producerErrors int
	)

	produceWg.Add(1)
	go func() {
		defer func() {
			produceWg.Done()
			log.Printf("exit success count...")
		}()
		for range producer.Successes() {
			producerSuccesses++
		}
	}()

	produceWg.Add(1)
	go func() {
		defer func() {
			produceWg.Done()
			log.Printf("exit error count...")
		}()
		for err := range producer.Errors() {
			log.Println(err)
			producerErrors++
		}
	}()

ProducerLoop:
	for {
		randomNum := rand.Intn(100000) + 1
		message := &sarama.ProducerMessage{Topic: topic, Key: sarama.StringEncoder(strconv.Itoa(randomNum)), Value: sarama.StringEncoder("This is a test message.")}
		select {
		case producer.Input() <- message:
			enqueued++
			time.Sleep(3 * time.Second)
		case <-mainCtx.Done():
			if err := producer.Close(); err != nil {
				log.Fatalln(err)
			} else {
				log.Printf("producer closed...")
			}
			log.Println("exit produece loop..")
			break ProducerLoop
		}
	}

	produceWg.Wait()

	log.Printf("All messages: %d; successfully produced: %d; errors: %d\n", enqueued, producerSuccesses, producerErrors)
}

func SaramaConsumer(mainCtx context.Context, mainWg *sync.WaitGroup) {
	defer mainWg.Done()
	consumer, err := sarama.NewConsumer([]string{kafka_url}, sarama.NewConfig())
	if err != nil {
		panic(err)
	}

	defer func() {
		if err := consumer.Close(); err != nil {
			log.Fatalln(err)
		}
	}()

	partitions, err := consumer.Partitions(topic)
	if err != nil {
		log.Fatalf("Failed to get partitions: %v", err)
	}

	var consumerWg sync.WaitGroup
	for _, partition := range partitions {
		currentPartition := partition
		consumerWg.Add(1)
		go func(ctx context.Context, partition int32, wg *sync.WaitGroup) {
			defer consumerWg.Done()
			partitionConsumer, err := consumer.ConsumePartition(topic, partition, sarama.OffsetNewest)
			if err != nil {
				panic(err)
			}

			consumed := 0
			defer func() {
				if err := partitionConsumer.Close(); err != nil {
					log.Fatalln(err)
				} else {
					log.Printf("consumer %d closed...", partition)
				}
			}()

			for {
				select {
				case msg := <-partitionConsumer.Messages():
					log.Printf("Consumer %d consumes message, key: %s, value: %s, offset: %d\n", partition, msg.Key, msg.Value, msg.Offset)
					consumed++
				case <-ctx.Done():
					log.Printf("Consumed: %d\n", consumed)
					return
				}
			}
		}(mainCtx, currentPartition, &consumerWg)
	}

	<-mainCtx.Done()
	consumerWg.Wait()
	log.Printf("exit consume...")
}
```