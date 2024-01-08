(function () { function run() {

  var TITLE = 'BOTs';
  if (window.disableMarkdownProcessing) {
    setTimeout(function () {
      // preload site.css for subsequent pages to be faster
      loadCSS();
    }, 4000);
    return;
  }

  loadCSS();
  loadMarkedScript();
  document.write('<!--');
  window.onload = processMarkdown;

  function loadMarkedScript() {
    var markedScriptElem = document.createElement('script');
    markedScriptElem.src =
      (/http/i.test(location.protocol || '') ? '//' : 'http://') +
      'unpkg.com/marked';

    var latestScript = document.scripts[document.scripts.length - 1];
    latestScript.parentElement.appendChild(markedScriptElem);
  }

  function loadCSS() {
    var style = document.createElement('style');
    style.innerHTML = getFunctionComment(cssContainer);
    (document.head || document.body).appendChild(style);
    function cssContainer() {/*
  html {
    background-color: white;
    color: black;
    overflow: hidden;
    padding: 0;
    margin: 0;
    background: url('data:image/jpeg;base64,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');
      background-size: cover;
    }

    body {
      overflow: hidden;
      padding: 0;
      margin: 0;
      width: 100%;
      height: 100%;
      background-image: url(mushroom-bg.jpg);
      background-size: cover;
    }

    .div-inner {
      border-top: solid 1px #89cf45;
      padding-left: 2em;
    }

    h1 {
      color: #353300;
      font-size: 1000%;
      font-size: 35vw;
      text-shadow: 0 1px 2px #b9ff00, 1px 0 2px #01c400, 0 -1px 2px #357200, -1px 0 2px #00d117;
      margin: 0;
      font-family: monospace;
    }

    h1 sub {
      font-size: 69%;
      font-family: sans-serif;
      position: relative;
      left: -0.1em;
      top: -0.025em;
      transform: rotate(3deg);
      display: inline-block;
    }

    .subtitle {
      margin-top: -4vw;
      margin-left: 2vw;
      color: #f9fccd;
      text-shadow: 0 1px 2px #005d0f, 1px 0 2px #005d0f, 0 -1px 2px #005d0f, -1px 0 2px #005d0f, 2px 4px 7px #113700, 2px 4px 16px #113700;
      padding-bottom: 0.5em;
      font-size: 3.55vw;
      font-family: monospace;
    }

    .subtitle .logo {
      color: #d0f6ff;
      text-shadow: 0 1px 2px #00315d, 1px 0 2px #00315d, 0 -1px 2px #00315d, -1px 0 2px #00315d, 2px 4px 7px #002737, 2px 4px 16px #001937;
    }

    .subtitle .logo .butterfly {
      color: transparent;
      text-shadow: 0 0 0 #aecbff, 0 1px 2px #00315d, 1px 0 2px #00315d, 0 -1px 2px #00315d, -1px 0 2px #00315d, 2px 4px 7px #002737, 2px 4px 16px #001937;
      padding-right: 0.3em;
    }

  */}
  }


  /** @param {Function} fn */
  function getFunctionComment(fn) {
    // first skip until (
    // then skip until )
    // then skip until {
    // then take everything until the last }
    var match =
      /^[^\(]*\([^\)]*\)[^\{]*\{\s*\/\*\s*([\s\S]*\S)\s*\*\/\s*\}[^\}]*$/.exec(fn + '');
  // /^[^\(]*\([^\)]*\)[^\{]*\{([ \t]*\n)([\s\S]*)([ \t]*\n[ \t]*)\}[^\}]*$/.exec(fn+'');
    return match && match[1] || '';
  }

  function processMarkdown() {
    if (typeof marked === 'undefined' || !marked) {
      return failedToLoadMarked();
    }

    var toHTML = typeof marked === 'function' ? marked : marked.marked;
    var markdown = extractCommentContent();
    var html = toHTML(markdown, { smartypants: true });
    console.log({ markdown: markdown, html: html });

    injectHead();

    var container = document.createElement('div');
    container.id = 'container';
    container.className = 'path-' +
      (location.pathname
        .replace(/^\/+/, '').replace(/\/+$/, '')
        || 'index.html'
      )
        .replace(/\.[a-z0-9]+$/, '').replace(/\.+/g, '-')
        .replace(/\/+/g, '-');
    container.className += ' document-' + container.className.split('-').reverse()[0];
    container.innerHTML = html;

    document.body.appendChild(container);

    var header = document.body.querySelector &&
      (document.body.querySelector('h1') || document.body.querySelector('h2'));

    if (header) {
      document.title = (header.textContent || header.innerText) + ' - \uD835\uDD46\ud835\udd50\ud835\udd40\u2115.\ud835\udd39\ud835\udd46';
      if (location.pathname !== '/' && location.pathname !== '/index.html') {
        var injectedHead = document.getElementById('head');
        if (injectedHead) {
          injectedHead.innerHTML = header.innerHT;
        }
      }
    }

    function extractCommentContent() {
      var wholeHTML = document.body.parentElement.outerHTML;
      var commentOpen = wholeHTML.indexOf('<' + '!--');
      var commentClose = wholeHTML.lastIndexOf('--' + '>');
      var inner = wholeHTML.slice(commentOpen + 4, commentClose);
      return inner;
    }

    function failedToLoadMarked() {
      var el = document.createElement('h2');
      el.textContent = el.innerText = 'Marked library code failed to load: ' + typeof marked;
      document.body.appendChild(el);
    }

    function injectHead() {
      var head = document.createElement('div');
      head.id = 'head';
      var linkHome = document.createElement('a');
      linkHome.style.cssText = 'color: inherit; text-decoration: inherit; font: inherit;';
      linkHome.textContent = linkHome.innerText = TITLE;
      linkHome.href = /file/i.test(location.protocol || '') ? './index.html' : '/';
      head.appendChild(linkHome);
      document.body.appendChild(head);
    }

  }

};  run() })()
