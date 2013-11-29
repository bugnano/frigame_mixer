$ = jQuery
fg = friGame

$(() ->
	fg.resourceManager
		.addSound('news', 'news_intro.ogg')
		.addSound('prova', 'prova.ogg')
		.addSound('s_news', 'news_intro.ogg', {streaming: true})
		.addSound('s_prova', 'prova.ogg', {streaming: true})

	fg.startGame(() ->
		fg.playground()
		fg.m.addMultiChannel('sfx')
		fg.m.addSingleChannel('music')

		$('#monosfx').click(() ->
			fg.m.sfx.play({sound: 'prova'})
		)

		$('#stereosfx').click(() ->
			fg.m.sfx.play({sound: 'news'})
		)

		$('#monowebaudio').click(() ->
			fg.m.music.play({sound: 'prova', loop: true})
		)

		$('#stereowebaudio').click(() ->
			fg.m.music.play({sound: 'news', loop: true})
		)

		$('#monohtml5').click(() ->
			fg.m.music.play({sound: 's_prova', loop: true})
		)

		$('#stereohtml5').click(() ->
			fg.m.music.play({sound: 's_news', loop: true})
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

