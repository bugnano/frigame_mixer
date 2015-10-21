/*global friGame, soundManager, Audio, AudioContext */
/*jslint white: true, browser: true */

// Copyright (c) 2011-2014 Franco Bugnano

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

// Uses ideas and APIs inspired by:
// gameQuery Copyright (c) 2008 Selim Arsever (gamequery.onaluf.org), licensed under the MIT

(function (fg) {
	'use strict';

	var
		overrides = {},
		sm2_loaded = false,
		audio_initialized = false,
		onError = fg.noop,
		context
	;

	fg.mixer = {
		canPlay: {}
	};

	// fg.m shortcut
	fg.m = fg.mixer;

	// Setup Web Audio API
	(function () {
		var
			a,
			canPlay = fg.m.canPlay
		;

		if (window.Audio) {
			a = new Audio();
			if (a.canPlayType('audio/wav; codecs="1"') === 'probably') {
				canPlay.wav = true;
			}

			if (a.canPlayType('audio/ogg; codecs="vorbis"') === 'probably') {
				canPlay.ogg = true;
				canPlay.oga = true;
			}

			if (a.canPlayType('audio/mpeg; codecs="mp3"') === 'probably') {
				canPlay.mp3 = true;
			}

			window.addEventListener('load', function () {
				try {
					window.AudioContext = window.AudioContext || window.webkitAudioContext;
					context = new AudioContext();
					context.createGain = context.createGain || context.createGainNode;
				}
				catch (e) {
					context = null;
				}

				audio_initialized = true;
			}, false);
		} else {
			audio_initialized = true;
		}
	}());

	// Setup soundManager2
	if (window.soundManager) {
		soundManager.onready(function() {
			// mp3 is the only supported format for the Flash 8 version of soundManager2
			if (!fg.mixer.canPlay.mp3) {
				fg.mixer.canPlay.mp3 = 'sm2';
			}

			sm2_loaded = true;
		});

		soundManager.ontimeout(function() {
			sm2_loaded = true;
		});

		soundManager.setup({
			url: './',
			flashVersion: 9,
			debugMode: false,
			useFlashBlock: false,

			preferFlash: true,
			useHTML5Audio: false,

			useHighPerformance: true,
			wmode: 'transparent',

			defaultOptions: {
				multiShot: true,
				multiShotEvents: true
			}
		});
	} else {
		sm2_loaded = true;
	}

	// Add an object to the preload list in order to wait for sound initialization
	// even if there are no sounds defined
	fg.resourceManager.preloadList.push({
		complete: function () {
			if (sm2_loaded && audio_initialized) {
				return true;
			}

			return false;
		}
	});

	fg.PSound = {
		init: function (name, soundURLs, options) {
			var
				my_options,
				new_options = options || {}
			;

			if (this.options) {
				my_options = this.options;
			} else {
				my_options = {};
				this.options = my_options;
			}

			// Set default options
			fg.extend(my_options, {
				// Public options
				streaming: false

				// Implementation details
			});

			fg.extend(my_options, fg.pick(new_options, ['streaming']));

			fg.extend(this, {
				// Public options
				name: name,

				// Implementation details
				soundURLs: soundURLs,
				initialized: false
			});
		},

		// Public functions

		remove: function () {
			var
				name = this.name
			;

			fg.each(fg.m, function () {
				if (this.sound_name === name) {
					this.stop();
				}
			});

			if (this.sound) {
				this.sound.stop();
				this.sound.destruct();
			}

			if (this.audio) {
				this.audio.pause();
			}
		},

		// Implementation details

		complete: function () {
			var
				sound = this.sound,
				audio = this.audio,
				soundURLs = this.soundURLs,
				i,
				canPlay = fg.m.canPlay,
				sound_url,
				len_sound_urls,
				format,
				request,
				completed = true,
				sound_object = this
			;

			if ((!sm2_loaded) || (!audio_initialized)) {
				return false;
			}

			if (!this.initialized) {
				// Step 1: Determine the sound URL
				if (typeof soundURLs === 'string') {
					// A single sound URL is given
					// Determine the file type by the extension (last 3 characters)
					format = soundURLs.slice(-3).toLowerCase();
					if (!canPlay[format]) {
						// Cannot determine file format by extension.
						// Assume it is an mp3 (the only format recognized by the Flash 8 version of soundManager2)
						format = 'mp3';
					}
					sound_url = soundURLs;
				} else if (soundURLs instanceof Array) {
					// Check which sound can be played
					len_sound_urls = soundURLs.length;
					for (i = 0; i < len_sound_urls; i += 1) {
						// Determine the file type by the extension (last 3 characters)
						format = soundURLs[i].slice(-3).toLowerCase();
						if (canPlay[format]) {
							sound_url = soundURLs[i];
							break;
						}
					}
				} else {
					// soundURLs is an object literal
					for (format in canPlay) {
						if (canPlay.hasOwnProperty(format)) {
							if (soundURLs[format]) {
								sound_url = soundURLs[format];
								break;
							}
						}
					}
				}

				// Step 2: Create the sound or the Audio element
				if (sound_url) {
					if (canPlay[format] === 'sm2') {
						// Sound supported through soundManager2
						sound = soundManager.createSound({
							id: this.name,
							url: sound_url
						});
						sound.load();
						this.sound = sound;
					} else if (canPlay[format]) {
						if (context && (!(this.options.streaming))) {
							// Sound supported through Web Audio API
							this.waitAudioBuffer = true;

							request = new XMLHttpRequest();

							request.open('GET', sound_url, true);
							request.responseType = 'arraybuffer';

							// Decode asynchronously
							request.onload = function () {
								context.decodeAudioData(request.response, function (buffer) {
									sound_object.audioBuffer = buffer;
									sound_object.waitAudioBuffer = false;
								}, onError);
							};

							request.send();
						} else {
							// Sound supported through HTML5 Audio
							audio = new Audio(sound_url);
							audio.load();
							this.audio = audio;
						}
					} else {
						// Sound type not supported -- It is not a fatal error
						fg.noop();
					}
				}

				this.initialized = true;
			}

			if (sound && (sound.readyState < 3)) {
				completed = false;
			}

			if (this.waitAudioBuffer) {
				completed = false;
			}

			if (audio && (audio.readyState < audio.HAVE_ENOUGH_DATA)) {
				completed = false;
			}

			return completed;
		}
	};

	fg.Sound = fg.Maker(fg.PSound);

	fg.resourceManager.addSound = function (name) {
		var
			sound = fg.Sound.apply(this, arguments)
		;

		return fg.resourceManager.addResource(name, sound);
	};

	fg.m.PChannel = {
		init: function (name, options) {
			var
				new_options = options || {}
			;

			this.name = name;

			// Set default options
			fg.extend(this, {
				// Public options
				muted: false,
				volume: 1,
				panning: 0

				// Implementation details
			});

			fg.extend(this, fg.pick(new_options, ['muted', 'volume', 'panning']));

			if (context) {
				this.gainL = context.createGain();
				this.gainR = context.createGain();
				this.splitter = context.createChannelSplitter(2);
				this.merger = context.createChannelMerger(2);

				this.splitter.connect(this.gainL, 0);
				this.splitter.connect(this.gainR, 1);

				this.gainL.connect(this.merger, 0, 0);
				this.gainR.connect(this.merger, 0, 1);

				this.merger.connect(context.destination);
			}

			this.setVolume(this);
		},

		remove: function () {
			var
				name = this.name
			;

			if (fg.m[name]) {
				delete fg.m[name];
			}
		},

		setVolume: function (options) {
			var
				new_options = options || {},
				sound = this.sound,
				audio = this.audio,
				merger = this.merger,
				min = Math.min,
				muted_redefined = new_options.muted !== undefined,
				volume_redefined = new_options.volume !== undefined,
				panning_redefined = new_options.panning !== undefined
			;

			if (muted_redefined) {
				this.muted = new_options.muted;
			}

			if (volume_redefined) {
				this.volume = fg.clamp(new_options.volume, 0, 1);
			}

			if (panning_redefined) {
				this.panning = fg.clamp(new_options.panning, -1, 1);
				if (sound) {
					sound.setPan(Math.round(this.panning * 100));
				}

				// Stereo panning is not supported for HTML5 Audio
			}

			if (muted_redefined || volume_redefined || panning_redefined) {
				if (merger) {
					if (this.muted) {
						this.gainL.gain.value = 0;
						this.gainR.gain.value = 0;
					} else {
						this.gainL.gain.value = this.volume * min(1 - this.panning, 1);
						this.gainR.gain.value = this.volume * min(1 + this.panning, 1);
					}
				}
			}

			if (muted_redefined || volume_redefined) {
				if (sound) {
					if (this.muted) {
						sound.setVolume(0);
					} else {
						sound.setVolume(Math.round(this.volume * 100));
					}
				} else if (audio) {
					audio.muted = this.muted;

					// Some HTML5 Audio implementations do not support the muted attribute,
					// so the audio is muted by setting its volume to 0 too.
					if (this.muted) {
						audio.volume = 0;
					} else {
						audio.volume = this.volume;
					}
				}
			}

			return this;
		}
	};

	fg.m.PSingleChannel = Object.create(fg.m.PChannel);
	fg.extend(fg.m.PSingleChannel, {
		init: function (name, options) {
			var
				channel = this
			;

			fg.m.PChannel.init.apply(this, arguments);

			this.doDisconnect = function () {
				channel.disconnect();
			};

			this.doReplay = function () {
				channel.replay();
			};
		},

		remove: function () {
			this.stop();

			fg.m.PChannel.remove.apply(this, arguments);
		},

		// Public functions

		play: function (name, options) {
			// options:
			// loop: true or false
			// callback: when done playing
			var
				new_options = options || {},
				sound_options = {},
				sound_object = fg.r[name] || {},
				sound = sound_object.sound,
				audio = sound_object.audio,
				audioBuffer = sound_object.audioBuffer,
				source,
				channel = this
			;

			// Make sure the audio is stopped before changing its options
			this.stop();

			if (sound) {
				this.sound = sound;
				this.sound_name = name;

				if (sound_object.options.streaming) {
					sound.stop();
				}

				if (this.muted) {
					sound_options.volume = 0;
				} else {
					sound_options.volume = Math.round(this.volume * 100);
				}

				sound_options.pan = Math.round(this.panning * 100);

				if (new_options.loop) {
					sound_options.onfinish = this.doReplay;
				} else if (new_options.callback) {
					sound_options.onfinish = function () {
						channel.disconnect();
						new_options.callback.call(channel, channel);
					};
				} else {
					sound_options.onfinish = this.doDisconnect;
				}

				sound.play(sound_options);
			} else if (audio) {
				this.audio = audio;
				this.sound_name = name;

				audio.pause();
				audio.currentTime = audio.startTime || 0;

				audio.muted = this.muted;

				// Some HTML5 Audio implementations do not support the muted attribute,
				// so the audio is muted by setting its volume to 0 too.
				if (this.muted) {
					audio.volume = 0;
				} else {
					audio.volume = this.volume;
				}

				if (new_options.loop) {
					audio.loop = true;
					audio.onended = null;
				} else if (new_options.callback) {
					audio.loop = false;
					audio.onended = function () {
						channel.disconnect();
						new_options.callback.call(channel, channel);
					};
				} else {
					audio.loop = false;
					audio.onended = this.doDisconnect;
				}

				audio.play();
			} else if (audioBuffer) {
				this.audioBuffer = audioBuffer;
				this.sound_name = name;

				source = context.createBufferSource();
				this.source = source;

				source.buffer = audioBuffer;
				if (audioBuffer.numberOfChannels < 2) {
					source.connect(this.gainL);
					source.connect(this.gainR);
				} else {
					source.connect(this.splitter);
				}

				if (new_options.loop) {
					source.loop = true;
					source.onended = null;
				} else if (new_options.callback) {
					source.loop = false;
					source.onended = function () {
						channel.disconnect();
						new_options.callback.call(channel, channel);
					};
				} else {
					source.loop = false;
					source.onended = this.doDisconnect;
				}

				this.startTime = context.currentTime;
				if (source.start) {
					source.start(0);
				} else {
					source.noteOn(0);
				}
			} else {
				// Make sure the callback gets called even if the sound cannot be played
				if ((!new_options.loop) && new_options.callback) {
					new_options.callback.call(channel, channel);
				}
			}

			return this;
		},

		stop: function () {
			var
				source = this.source
			;

			if (this.sound) {
				this.sound.stop();
			}

			if (this.audio) {
				this.audio.pause();
				this.audio.currentTime = this.audio.startTime || 0;
			}

			this.pauseTime = 0;
			this.old_loop = false;
			this.old_onended = null;

			if (source) {
				if (source.buffer) {
					source.onended = null;

					if (source.stop) {
						source.stop(0);
					} else {
						source.noteOff(0);
					}
				}
			}

			this.disconnect();

			return this;
		},

		pause: function () {
			var
				source = this.source
			;

			if (this.sound) {
				this.sound.pause();
			}

			if (this.audio) {
				this.audio.pause();
			}

			if (source && source.buffer && (!(this.pauseTime))) {
				// Since pause / resume is not supported in the Web Audio API, here the currentTime is saved,
				// in order to create a new source object when the sound is resumed
				this.old_loop = source.loop;
				this.old_onended = source.onended;
				source.loop = false;
				source.onended = null;

				this.pauseTime = context.currentTime;
				if (source.stop) {
					source.stop(0);
				} else {
					source.noteOff(0);
				}

				this.source = null;
			}

			return this;
		},

		resume: function () {
			var
				source,
				audioBuffer = this.audioBuffer,
				offset
			;

			if (this.sound) {
				this.sound.resume();
			}

			if (this.audio) {
				this.audio.play();
			}

			if (this.pauseTime) {
				// Since pause / resume is not supported in the Web Audio API, a new source object is created
				// containing all the values of the old source object
				source = context.createBufferSource();
				this.source = source;

				source.buffer = audioBuffer;
				if (audioBuffer.numberOfChannels < 2) {
					source.connect(this.gainL);
					source.connect(this.gainR);
				} else {
					source.connect(this.splitter);
				}

				source.loop = this.old_loop;
				source.onended = this.old_onended;
				this.old_loop = false;
				this.old_onended = null;

				offset = (this.pauseTime - this.startTime) % audioBuffer.duration;

				this.pauseTime = 0;
				this.startTime = context.currentTime - offset;
				if (source.start) {
					source.start(0, offset);
				} else {
					source.noteGrainOn(0, offset);
				}
			}

			return this;
		},

		// Implementation details

		replay: function () {
			var
				sound_options = {}
			;

			if (this.muted) {
				sound_options.volume = 0;
			} else {
				sound_options.volume = Math.round(this.volume * 100);
			}

			sound_options.pan = Math.round(this.panning * 100);

			sound_options.onfinish = this.doReplay;

			this.sound.play(sound_options);
		},

		disconnect: function () {
			this.sound = null;

			if (this.audio) {
				this.audio.loop = false;
			}

			this.audio = null;

			if (this.source) {
				this.source.loop = false;
			}

			this.source = null;
			this.audioBuffer = null;

			this.sound_name = null;
		}
	});

	fg.m.SingleChannel = fg.Maker(fg.m.PSingleChannel);

	fg.m.addSingleChannel = function (name, options) {
		fg.m[name] = fg.m.SingleChannel(name, options);

		return this;
	};

	fg.m.PMultiChannel = Object.create(fg.m.PChannel);
	fg.extend(fg.m.PMultiChannel, {
		play: function (name, options) {
			// options:
			// callback: when done playing
			var
				new_options = options || {},
				sound_options = {},
				sound_object = fg.r[name] || {},
				sound = sound_object.sound,
				audio = sound_object.audio,
				audioBuffer = sound_object.audioBuffer,
				source,
				channel = this
			;

			if (sound) {
				if (this.muted) {
					sound_options.volume = 0;
				} else {
					sound_options.volume = Math.round(this.volume * 100);
				}

				sound_options.pan = Math.round(this.panning * 100);

				if (new_options.callback) {
					sound_options.onfinish = function () {
						new_options.callback.call(channel, channel);
					};
				} else {
					sound_options.onfinish = null;
				}

				sound.play(sound_options);
			} else if (audio) {
				audio.pause();
				audio.currentTime = audio.startTime || 0;

				audio.muted = this.muted;

				// Some HTML5 Audio implementations do not support the muted attribute,
				// so the audio is muted by setting its volume to 0 too.
				if (this.muted) {
					audio.volume = 0;
				} else {
					audio.volume = this.volume;
				}

				audio.loop = false;

				if (new_options.callback) {
					audio.onended = function () {
						new_options.callback.call(channel, channel);
					};
				} else {
					audio.onended = null;
				}

				audio.play();
			} else if (audioBuffer) {
				source = context.createBufferSource();
				source.buffer = audioBuffer;
				if (audioBuffer.numberOfChannels < 2) {
					source.connect(this.gainL);
					source.connect(this.gainR);
				} else {
					source.connect(this.splitter);
				}

				source.loop = false;

				if (new_options.callback) {
					source.onended = function () {
						new_options.callback.call(channel, channel);
					};
				} else {
					source.onended = null;
				}

				if (source.start) {
					source.start(0);
				} else {
					source.noteOn(0);
				}
			} else {
				// Make sure the callback gets called even if the sound cannot be played
				if (new_options.callback) {
					new_options.callback.call(channel, channel);
				}
			}

			return this;
		}
	});

	fg.m.MultiChannel = fg.Maker(fg.m.PMultiChannel);

	fg.m.addMultiChannel = function (name, options) {
		fg.m[name] = fg.m.MultiChannel(name, options);

		return this;
	};

	if (fg.fx) {
		fg.m.hooks = {
			volume: {
				get: function (s) {
					return s.volume;
				},
				set: function (s, value) {
					s.setVolume({volume: value});
				}
			},

			panning: {
				get: function (s) {
					return s.panning;
				},
				set: function (s, value) {
					s.setVolume({panning: value});
				}
			}
		};

		overrides.PChannel = fg.pick(fg.m.PChannel, [
			'remove'
		]);

		fg.extend(fg.m.PChannel, {
			tween: function (properties, options) {
				return fg.fx.tween.call(this, fg.m.hooks, properties, options);
			},

			clearTweens: function () {
				fg.fx.remove.call(this);

				return this;
			},

			removeTween: function (name) {
				return fg.fx.removeTween.call(this, name);
			},

			remove: function () {
				fg.fx.remove.call(this);

				overrides.PChannel.remove.apply(this, arguments);
			}
		});
	}
}(friGame));

