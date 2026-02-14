```go
package main  
  
import (  
    "fmt"  
    "github.com/gorilla/mux"    "github.com/sirupsen/logrus"    "log"    "net/http"    "os"    "os/exec"    "strings"    "sync")  
  
var (  
    sccLock sync.Mutex  
    Logger  *logrus.Logger  
    sccConf = "/root/run_env/public-nat-agent/conf/scc/scc.conf"  
    sccBin  = "/usr/local/seccomponent/bin/CryptoAPI"  
    logFile = "/var/log/shinerio-server.log" // 添加数据库连接  
)  
  
func init() {  
    os.Setenv("CGO_ENABLED", "1")  
    Logger = logrus.New()  
    // 设置输出到文件  
    file, err := os.OpenFile(logFile, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0600)  
    if err == nil {  
       Logger.Out = file  
    } else {  
       panic("init log failed.")  
    }  
    // 设置日志级别  
    Logger.Level = logrus.InfoLevel  
}  
  
func main() {  
    r := mux.NewRouter()  
    r.HandleFunc("/", index)  
    r.HandleFunc("/encode/{text}", encryptText)  
    r.HandleFunc("/decode/{text}", decryptText)  
    r.HandleFunc("/credential", credential)  
    r.HandleFunc("/save/{key}/{value}", saveCredential)  
    r.HandleFunc("/delete/{key}", deleteCredential)  
    ExecSql("create table if not exists keyvalues (key varchar(255) not null primary key, encrypted_value varchar(255) not null, plain_value varchar(255) not null)")  
    err := http.ListenAndServe("0.0.0.0:19889", r)  
    if err != nil {  
       Logger.Fatal(err)  
    }  
}  
  
func index(w http.ResponseWriter, r *http.Request) {  
    w.Write([]byte("服务器已准备好，加密包含特殊字符请通过\"https://tool.chinaz.com/tools/urlencode.aspx\"进行URL编码"))  
}  
  
func credential(w http.ResponseWriter, r *http.Request) {  
    clientAddr := strings.Split(r.RemoteAddr, ":")[0]  
    Logger.Infof("receive credential request from %s", clientAddr)  
    rows := querySql("select * from keyvalues")  
    w.Write([]byte(fmt.Sprintf("<p>Note that your operation has been recorded., ip is: %s</p>\n", clientAddr)))  
    w.Write([]byte("<table border=\"1\">\n  <thead>\n    <tr>\n      <th>key</th>\n      <th>密文</th>\n      <th>明文</th>\n    </tr>\n  </thead>\n  <tbody>\n"))  
    for rows.Next() {  
       var key, encrypted_value, plain_value string  
       err := rows.Scan(&key, &encrypted_value, &plain_value)  
       if err != nil {  
          Logger.Error(err)  
       }  
       row := fmt.Sprintf("   <tr>\n      <td>%s</td>\n      <td>%s</td>\n      <td>%s</td>\n    </tr>\n", key, encrypted_value, plain_value)  
       w.Write([]byte(row))  
    }  
    w.Write([]byte("</tbody>\n</table>"))  
}  
  
func saveCredential(w http.ResponseWriter, r *http.Request) {  
    clientAddr := strings.Split(r.RemoteAddr, ":")[0]  
    Logger.Infof("receive save credential request from %s", clientAddr)  
    vars := mux.Vars(r)  
    encryptedValueBytes, _ := encrypt(vars["value"])  
    key, encryptedValue, plainValue := vars["key"], string(encryptedValueBytes), vars["value"]  
    ExecSql(fmt.Sprintf("insert or replace into keyvalues values('%s', '%s', '%s')", key, encryptedValue, plainValue))  
    w.Write([]byte(fmt.Sprintf("Note that your operation has been recorded., ip is: %s\n", clientAddr)))  
    w.Write([]byte("save success"))  
}  
  
func deleteCredential(w http.ResponseWriter, r *http.Request) {  
    clientAddr := strings.Split(r.RemoteAddr, ":")[0]  
    Logger.Infof("receive delete credential request from %s", clientAddr)  
    vars := mux.Vars(r)  
    key := vars["key"]  
    ExecSql(fmt.Sprintf("delete from keyvalues where key ='%s'", key))  
    w.Write([]byte(fmt.Sprintf("Note that your operation has been recorded., ip is: %s\n", clientAddr)))  
    w.Write([]byte("delete success."))  
}  
  
func encryptText(w http.ResponseWriter, r *http.Request) {  
    clientAddr := strings.Split(r.RemoteAddr, ":")[0]  
    vars := mux.Vars(r)  
    plainText := vars["text"]  
    Logger.Infof("receive encrypt '%s' request from %s", plainText, clientAddr)  
    sccLock.Lock()  
    defer sccLock.Unlock()  
    output, err := encrypt(plainText)  
    w.Write([]byte(fmt.Sprintf("Note that your operation has been recorded., ip is: %s\n", clientAddr)))  
    _, err = w.Write([]byte(fmt.Sprintf("encrypt result is : %s", output)))  
    if err != nil {  
       Logger.Errorf("encrypt failed for client %s", clientAddr)  
    }  
}  
  
func encrypt(plainText string) ([]byte, error) {  
    output, err := exec.Command(sccBin, "--conffile", sccConf, "-e", plainText).Output()  
    if err != nil {  
       Logger.Error(err)  
    }  
    return output, err  
}  
  
func decryptText(w http.ResponseWriter, r *http.Request) {  
    clientAddr := strings.Split(r.RemoteAddr, ":")[0]  
    vars := mux.Vars(r)  
    encodedText := vars["text"]  
    Logger.Infof("receive decrypt '%s' request from %s", encodedText, clientAddr)  
    sccLock.Lock()  
    defer sccLock.Unlock()  
    output, err := exec.Command(sccBin, "--conffile", sccConf, "-d", encodedText).Output()  
    if err != nil {  
       log.Fatal(err)  
    }  
  
    w.Write([]byte(fmt.Sprintf("Note that your operation has been recorded., ip is: %s\n", clientAddr)))  
    _, err = w.Write([]byte(fmt.Sprintf("decrypt result is : %s", output)))  
    if err != nil {  
       Logger.Errorf("decrypt failed for client %s", clientAddr)  
    }  
}
```

```go
package main  
  
import (  
    "database/sql"  
    _ "github.com/mattn/go-sqlite3"  
)  
  
func ExecSql(sqlExpr string) {  
    db, err := sql.Open("sqlite3", "./shinerio-server.db")  
    if err != nil {  
       Logger.Error("get conn failed.")  
    }  
    defer db.Close()  
  
    stmt, err := db.Prepare(sqlExpr)  
    if err != nil {  
       Logger.Error(err)  
    }  
    defer stmt.Close()  
  
    _, err = stmt.Exec()  
    if err != nil {  
       Logger.Error(err)  
    }  
}  
  
func querySql(sqlExpr string) *sql.Rows {  
    db, err := sql.Open("sqlite3", "./shinerio-server.db")  
    if err != nil {  
       Logger.Error("get conn failed.")  
    }  
    defer db.Close()  
  
    stmt, err := db.Prepare(sqlExpr)  
    if err != nil {  
       Logger.Error(err)  
    }  
    defer stmt.Close()  
  
    rows, err := stmt.Query()  
    if err != nil {  
       Logger.Error(err)  
    }  
    return rows  
}
```