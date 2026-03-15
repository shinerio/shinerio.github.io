import * as path from 'path';

describe('article-presenter TOC helpers', () => {
  const modulePath = path.resolve(__dirname, '../../templates/assets/js/article-presenter.js');

  beforeEach(() => {
    jest.resetModules();
  });

  it('collects TOC links that map to presenter headings by id', () => {
    const presenter = require(modulePath);

    const links = [
      makeLink('#intro'),
      makeLink('#missing'),
      makeLink('/articles/other-page.html')
    ];
    const introHeading = makeHeading('intro', 40);
    const presenterArticle = {
      querySelectorAll: jest.fn(() => [introHeading])
    };

    const targets = presenter.collectPresenterTocTargets(links, presenterArticle);

    expect(targets).toHaveLength(1);
    expect(targets[0].link).toBe(links[0]);
    expect(targets[0].heading).toBe(introHeading);
  });

  it('resolves the active heading id from presenter heading positions', () => {
    const presenter = require(modulePath);

    const introHeading = makeHeading('intro', -20);
    const detailsHeading = makeHeading('details', 90);
    const appendixHeading = makeHeading('appendix', 240);

    const activeId = presenter.resolveActiveHeadingId([
      { link: makeLink('#intro'), heading: introHeading },
      { link: makeLink('#details'), heading: detailsHeading },
      { link: makeLink('#appendix'), heading: appendixHeading }
    ], 110);

    expect(activeId).toBe('details');
  });

  it('computes presenter scroll targets relative to the presenter shell', () => {
    const presenter = require(modulePath);

    const heading = makeHeading('details', 280);
    const target = presenter.computePresenterScrollTop(heading, 40, 500, 48);

    expect(target).toBe(692);
  });
});

function makeLink(href: string) {
  return {
    getAttribute(name: string) {
      if (name === 'href') {
        return href;
      }
      return null;
    }
  };
}

function makeHeading(id: string, top: number) {
  return {
    id,
    getBoundingClientRect() {
      return { top };
    }
  };
}
