$ = jQuery
fg = friGame

$(() ->
	fg.resourceManager
		.addSound('stereomp3', 'news_intro.mp3')
		.addSound('monomp3', 'prova.mp3')
		.addSound('news', ['news_intro.ogg', 'news_intro.mp3'])
		.addSound('prova', ['prova.ogg', 'prova.mp3'])

	$('#start').one('click', () ->
		fg.startGame(() ->
			$('<div id="loaded">Loaded</div>').insertBefore('#playground')
			$('<div id="dbgconsole"></div>').insertAfter('#loaded')
			debug_print = (text) ->
				$('<div></div>')
					.html(text)
					.appendTo('#dbgconsole')

			$('#loadmono').click(() ->
				fg.m.music.stop()

				if fg.r.s_news
					fg.resourceManager.removeResource('s_news')

				if fg.r.s_prova
					fg.resourceManager.removeResource('s_prova')

				fg.resourceManager
					.addSound('s_prova', ['prova.ogg', 'prova.mp3'], {streaming: true})

				fg.startGame(() ->
					debug_print('Loaded mono')
					debug_print("audio: #{fg.r.s_prova.audio}")
					if fg.r.s_prova.audio
						debug_print("src: #{fg.r.s_prova.audio.src}")
						debug_print("error: #{fg.r.s_prova.audio.error}")
						debug_print("networkState: #{fg.r.s_prova.audio.networkState}")
						debug_print("readyState: #{fg.r.s_prova.audio.readyState}")
				)
			)

			$('#loadstereo').click(() ->
				fg.m.music.stop()

				if fg.r.s_news
					fg.resourceManager.removeResource('s_news')

				if fg.r.s_prova
					fg.resourceManager.removeResource('s_prova')

				fg.resourceManager
					.addSound('s_news', ['news_intro.ogg', 'news_intro.mp3'], {streaming: true})

				fg.startGame(() ->
					debug_print('Loaded stereo')
					debug_print("audio: #{fg.r.s_news.audio}")
					if fg.r.s_news.audio
						debug_print("src: #{fg.r.s_news.audio.src}")
						debug_print("error: #{fg.r.s_news.audio.error}")
						debug_print("networkState: #{fg.r.s_news.audio.networkState}")
						debug_print("readyState: #{fg.r.s_news.audio.readyState}")
				)
			)

			debug_print('canPlay:')
			for k, v of fg.m.canPlay
				debug_print("#{k}: #{v}")

			debug_print("audioBuffer: #{fg.r.news.audioBuffer}")

			fg.playground()
			fg.m.addMultiChannel('sfx')
			fg.m.addSingleChannel('music')

			$('#monomp3').click(() ->
				fg.m.sfx.play('monomp3')
			)

			$('#stereomp3').click(() ->
				fg.m.sfx.play('stereomp3')
			)

			$('#monosfx').click(() ->
				fg.m.sfx.play('prova')
			)

			$('#stereosfx').click(() ->
				fg.m.sfx.play('news')
			)

			$('#monowebaudio').click(() ->
				fg.m.music.play('prova', {loop: true})
			)

			$('#stereowebaudio').click(() ->
				fg.m.music.play('news', {loop: true})
			)

			$('#monohtml5').click(() ->
				fg.m.music.play('s_prova', {loop: true})
				if fg.r.s_prova
					if fg.r.s_prova.audio
						debug_print("src: #{fg.r.s_prova.audio.src}")
						debug_print("error: #{fg.r.s_prova.audio.error}")
						debug_print("networkState: #{fg.r.s_prova.audio.networkState}")
						debug_print("readyState: #{fg.r.s_prova.audio.readyState}")
			)

			$('#stereohtml5').click(() ->
				fg.m.music.play('s_news', {loop: true})
				if fg.r.s_news
					if fg.r.s_news.audio
						debug_print("src: #{fg.r.s_news.audio.src}")
						debug_print("error: #{fg.r.s_news.audio.error}")
						debug_print("networkState: #{fg.r.s_news.audio.networkState}")
						debug_print("readyState: #{fg.r.s_news.audio.readyState}")
			)

			$('#panleft').click(() ->
				fg.m.sfx.tween({panning: -1}, {duration: 1000})
				fg.m.music.tween({panning: -1}, {duration: 1000})
			)

			$('#pancenter').click(() ->
				fg.m.sfx.tween({panning: 0}, {duration: 1000})
				fg.m.music.tween({panning: 0}, {duration: 1000})
			)

			$('#panright').click(() ->
				fg.m.sfx.tween({panning: 1}, {duration: 1000})
				fg.m.music.tween({panning: 1}, {duration: 1000})
			)

			$('#stop').click(() ->
				fg.m.music.stop()
			)
		)
	)
)

