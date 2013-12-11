$ = jQuery
fg = friGame

$(() ->
	fg.resourceManager
		.addSound('stereomp3', 'news_intro.mp3')
		.addSound('monomp3', 'prova.mp3')
		.addSound('news', ['news_intro.ogg', 'news_intro.mp3'])
		.addSound('prova', ['prova.ogg', 'prova.mp3'])
		.addSound('s_news', ['news_intro.ogg', 'news_intro.mp3'], {streaming: true})
		.addSound('s_prova', ['prova.ogg', 'prova.mp3'], {streaming: true})

	$('#start').one('click', () ->
		fg.startGame(() ->
			$('<div>Loaded</div>').prependTo('#playground')
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
			)

			$('#stereohtml5').click(() ->
				fg.m.music.play('s_news', {loop: true})
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

