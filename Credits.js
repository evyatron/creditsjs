(function(scope){
  function Credits() {
    var self = this,
      el = null, elScreen = null, elStyle = null,
      indexScreen = 0, numberOfCharacters = 0, delay = 1000,
      timeoutNextScreen = null,
      credits = [],

      TRANSFORM_OPTIONS = {
        'origin': '',
        'easing': '',
        'duration': 0,
        'from': '',
        'to': '',
        'from-odd': '',
        'to-odd': ''
      },
      DEFAULT_OPTIONS = {
        'origin': '50% 50%',
        'easing': 'ease',
        'duration': 300,
        'from': '',
        'to': ''
      },

      EV_TRANSITION_END = 'transitionend',
      CSS_PREFIX = '',
      DELAY_PER_LETTER = 20,

      eventsCallbacks = {};

    this.show = function Credits_show(options) {
      indexScreen = 0;
      credits = options.text;
      options.delay && (delay = options.delay);

      var preset = PRESETS[options.animation] || {};
      for (var key in TRANSFORM_OPTIONS) {
        TRANSFORM_OPTIONS[key] = preset[key] || options[key] || DEFAULT_OPTIONS[key];
      }

      self.stop();

      trigger('show', credits);

      createElements();
      createStyle();

      el.addEventListener(EV_TRANSITION_END, onElementShown);
      window.setTimeout(function onShowingCredits(){
        document.body.classList.add('credits-visible');
      }, 50);
    };

    this.stop = function Credits_stop() {
      window.clearTimeout(timeoutNextScreen);
      if (el) {
        trigger('stop', indexScreen);
      }
      removeElements();
    };

    this.hide = function Credits_hide() {
      el.addEventListener(EV_TRANSITION_END, onElementHidden);

      window.setTimeout(function onHidingCredits(){
        document.body.classList.remove('credits-visible');
      }, 0);
    };

    this.getPresets = function Credits_getPresets() {
      return PRESETS;
    };

    function onElementShown() {
      el.removeEventListener(EV_TRANSITION_END, onElementShown);
      showScreen();
    }
    function onElementHidden() {
      el.removeEventListener(EV_TRANSITION_END, onElementHidden);
      removeElements(true);
      trigger('hide');
    }

    function removeEvents() {
      if (!el) {
        return;
      }
      el.removeEventListener(EV_TRANSITION_END, onElementShown);
      el.removeEventListener(EV_TRANSITION_END, onElementHidden);
      var elLastLetter = el.querySelectorAll('em')[numberOfCharacters-1];
      elLastLetter.removeEventListener(EV_TRANSITION_END, onScreenDone);
    }

    function nextScreen() {
      indexScreen++;
      showScreen();
    }

    function showScreen() {
      trigger('screenShow', indexScreen);

      document.body.classList.remove('credits-playing');

      printCredits();

      window.setTimeout(function(){
        document.body.classList.add('credits-playing');
      }, 0);
    }

    function printCredits() {
      var html = [],
        lines = credits[indexScreen];

      if (!lines) {
        self.hide();
        return;
      }

      numberOfCharacters = 0;

      for (var i=0,line; line=lines[i++];) {
        html[html.length] = '<div><span>';
        for (var j=0,letter; letter=line[j++];) {
          html[html.length] = letter!==' '? '<em class="i' + numberOfCharacters++ + '">' + letter + '</em>' : '</span><span>';
        }
        html[html.length] = '</span></div>';
      }

      createStyle();

      el.innerHTML = html.join('');

      var elLastLetter = el.querySelectorAll('em')[numberOfCharacters-1];
      elLastLetter.addEventListener(EV_TRANSITION_END, onScreenDone);

      el.style.marginTop = -el.offsetHeight/2 + 'px';

      trigger('screenReady', indexScreen);
    }

    function onScreenDone() {
      this.removeEventListener(EV_TRANSITION_END, onScreenDone);
      timeoutNextScreen = window.setTimeout(nextScreen, delay + numberOfCharacters*DELAY_PER_LETTER);

      trigger('screenDone', {
        "index": indexScreen,
        "delay": delay + numberOfCharacters*DELAY_PER_LETTER
      });
    }

    function removeElements(bRemoveScreen) {
      el && el.parentNode.removeChild(el);
      elStyle && elStyle.parentNode.removeChild(elStyle);
      el = elStyle = null;

      if (bRemoveScreen) {
        elScreen && elScreen.parentNode.removeChild(elScreen);
        elScreen = null;
      }

      document.body.classList.remove('credits-visible');
    }

    function createElements() {
      if (!el) {
        el = document.createElement('div');
        el.id = 'credits';
        document.body.appendChild(el);
      }

      if (!elScreen) {
        elScreen = document.createElement('div');
        elScreen.id = 'credits-screen';
        document.body.appendChild(elScreen);
      }
    }

    function createStyle() {
      trigger('styleCreate');

      elStyle && elStyle.parentNode.removeChild(elStyle);

      var i = 0, text = '',
        cssSelector = '#' + el.id + ' > div > span > em',
        transitionStep = TRANSFORM_OPTIONS.duration/5,
        style = [
          '#' + el.id + ' { position: fixed; top: 50%; left: 0; right: 0; z-index: 600; text-align: center;  font-size: 60px; color: #fff; }',
          '#' + elScreen.id + ' { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 500; background: #000; }',
          '#' + el.id + ', #' + elScreen.id + ' { pointer-events: none; opacity: 0; -webkit-transition: opacity .4s linear; -moz-transition: opacity .4s linear; transition: opacity .4s linear; }',
          '.credits-visible #' + el.id + ', .credits-visible #' + elScreen.id + ' { opacity: 1; pointer-events: inherit; }',
          '#' + el.id + ' > div > span { display: inline-block; white-space: nowrap; margin: 0 10px; }',
          cssSelector + '{ position: relative; display: inline-block; font-style: normal; opacity: 0; ' + CSS_PREFIX + 'transform-origin: ' + TRANSFORM_OPTIONS.origin + '; ' + CSS_PREFIX + 'transform: ' + TRANSFORM_OPTIONS.from + '; ' + CSS_PREFIX + 'transition: all ' + TRANSFORM_OPTIONS.duration + 'ms ' + TRANSFORM_OPTIONS.easing + ';}',
          TRANSFORM_OPTIONS['from-odd']? cssSelector + ':nth-child(2n+1){ ' + CSS_PREFIX + 'transform: ' + TRANSFORM_OPTIONS['from-odd'] + ';}' : '',
          '.credits-playing ' + cssSelector + '{ opacity: 1; ' + CSS_PREFIX + 'transform: ' + TRANSFORM_OPTIONS.to + ';}'
        ];

      elStyle = document.createElement('style')

      for (i=0; i<numberOfCharacters; i++) {
        style.push(cssSelector + '.i' + i + '{ ' + CSS_PREFIX + 'transition-delay: ' + i*transitionStep + 'ms; }');
      }

      elStyle.innerHTML = style.join("\n");
      document.body.appendChild(elStyle);
    }

    this.bind = function Credits_bind(eventName, callbackMethod) {
      if (callbackMethod instanceof Function) {
        !eventsCallbacks[eventName] && (eventsCallbacks[eventName] = {});
        eventsCallbacks[eventName][callbackMethod] = true;
      }
    };

    function trigger() {  
      var eventName = arguments[0],
          args = Array.prototype.splice.call(arguments, 1),
          methods = eventsCallbacks[eventName] || {};

      console.info(eventName + ':', args);

      for (var method in methods) {
        method.call(self, args);
      }
    }

    var PRESETS = {
      'intertwine': {
        'from': 'translate3d(0, -100%, 0)',
        'to': 'translate3d(0, 0, 0)',
        'from-odd': 'translate3d(0, 100%, 0)',
        'to-odd': 'translate3d(0, 0, 0)',
        'speed': 300
      },
      'ttb': {
        'from': 'translate3d(0, -100%, 0)',
        'to': 'translate3d(0,0,0)'
      },
      'btt': {
        'from': 'translate3d(0, 100%, 0)',
        'to': 'translate3d(0,0,0)'
      },
      'rtl': {
        'from': 'translate3d(400%, 0, 0)',
        'to': 'translate3d(0, 0, 0)'
      },
      'ltr': {
        'from': 'translate3d(-400%, 0, 0)',
        'to': 'translate3d(0, 0, 0)'
      },
      'flip-vertical': {
        'from': 'scale(1, 0)',
        'to': 'scale(1)'
      },
      'flip-horizontal': {
        'from': 'scale(0, 1)',
        'to': 'scale(1)',
        'speed': 250,
        'easing': 'linear'
      },
      'shrink': {
        'from': 'scale(4)',
        'to': 'scale(1)',
        'speed': 500
      },
      'expand': {
        'from': 'scale(0)',
        'to': 'scale(1)',
        'easing': 'ease-out',
        'speed': 300
      },
      'spin': {
        'from': 'rotate(-360deg)',
        'to': 'rotate(0deg)',
        'speed': 600
      },
      'spin-ccw': {
        'from': 'rotate(360deg)',
        'to': 'rotate(0deg)',
        'speed': 600
      },
      'spin-top': {
        'from': 'rotate(90deg)',
        'to': 'rotate(0deg)',
        'origin': '50% 100%',
        'speed': 300
      },
      'spin-ninja': {
        'from': 'scale(5) rotate(-360deg)',
        'to': 'scale(1) rotate(0deg)',
        'speed': 170
      }
    };
  }

  scope.Credits = new Credits();
}(window));