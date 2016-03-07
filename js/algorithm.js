(function () {
	"use strict";

	if (!Date.now)
		Date.now = function () {
			return (new Date()).getTime();
		}

	/*CONSTANTS*/
	var INITIAL_COINS = 10;
	var AIMED_COINS = 500;
	var FABRIC_COST = 20;
	var FACTORY_COST = 70;
	var MAX_FABRICS = 10;
	var MAX_FACTORIES = 5;
	var CREATE_INTERVAL = 5000;

	function inheritPrototype (from, to) {
		from = from.prototype || from;
		to = to.prototype || to;

		for (var key in from) {
			if (typeof from[key] === 'function')
				(function (key) {
					to[key] = function () {return from[key].apply(this, arguments);}
				})(key);
		}
	}

	function when (ms) {
		return Date.now() + ms;
	}

	/*Interface for ivent listeners*/
	function Interactive () {

	}

	Interactive.prototype = {
		addClass: function (cls) {
			this.e.classList.add(cls);
			return this;
		},

		dissappear: function () {
			this.e.parentNode.removeChild(this.e);
			return this;
		},

		hide: function (hide) {
			if (!arguments.length)
				hide = true;
			return hide ? this.addClass('hidden') : this.removeClass('hidden');
		},

		on: function (type, handler) {
			var self = this,
			    target = this.e;
			function addEvent (event) {
				event = event || window.event;
				return handler.call(self);
			}

			try {
				target.addEventListener(type, addEvent, false);
			} catch (e) {
				target.attachEvent(['on', type].join(''), addEvent);
			}

			return this;
		},

		removeClass: function (cls) {
			this.e.classList.remove(cls);
			return this;
		},

		show: function (show) {
			if (!arguments.length)
				show = true;
			return show ? this.removeClass('hidden') : this.addClass('hidden');
		}
	}


	function Item (src) {
		this.e = new Image();
		this.e.src = src;
	}

	function Coin () {
		Item.call(this, '../img/coin.png');
	}

	inheritPrototype(Interactive, Coin);

	Coin.prototype.setStyle = function (style) {
		for (var key in style)
			this.e.style[key] = style[key];
		return this;
	}

	function Construction (src, room, atOnece, placeId) {
		Item.call(this, src);
		this.room = room;
		this.atOnece = atOnce;
		this.placeId = placeId;
	}

	Construction.prototype.createCoins = function () {
		for (var i = 0; i < this.atOnece; ++i)
			this.room.createCoin();
		return this;
	}

	function Fabric (room) {
		Construction.call(this, "../img/fabric.png", room, 1, 'fabrics');
	}

	inheritPrototype(Construction, Fabric);

	function Factory (room) {
		Construction.call(this, "../img/factory.png", room, 2, 'factories');
	}

	inheritPrototype(Construction, Factory);


	function Button (elem) {
		this.e = elem;
	}

	inheritPrototype(Interactive, Button);


	/*Timer manager*/
	function Timer (ms) {
		this.tasks = {};
		this.ms = ms || 100;
	}

	inheritPrototype({
		addTask: function (task, when, args, context) {
			if (this.tasks[when])
				this.tasks[when].push({task: task, args: args, context: context});
			else
				this.tasks[when] = [{task: task, args: args, context: context}];
			return this;
		},

		complete: function () {
			var now = Date.now();
			for (var key in this.tasks) {
				if (now >= +key) {
					var list = this.tasks[key];

					delete this.tasks[key];

					for (var i = 0, l = list.length; i < l; ++i) {
						var task = list[i];

						task.task.apply(task.context || window, task.args);
					}
				}
			}

			return this.stop().setInterval();
		},

		setInterval: function () {
			if (this.interval)
				return this;
			var self = this;
			this.interval = setInterval(function () {self.complete.call(self);}, this.ms);
			return this;
		},

		start: function () {return this.setInterval();},

		stop: function () {
			if (!this.interval)
				return this;

			clearInterval(this.interval);
			delete this.interval;

			return this;
		}
	}, Timer);

	function Room (elem) {

		this.e = elem;

		this.field = document.getElementById('field');
		this.factoryLine = document.getElementById('factories');
		this.fabricLine = document.getElementById('fabrics');

		this.fabrics = 0;
		this.factories = 0;

		this.timer = new Timer(200);

		var self = this;

		

		new Button(document.getElementById('start')).on('click', function () {
			this.dissappear();
			self.start();
		});
	}

	inheritPrototype({
		addCoin: function () {
			var coins = this.coins || 0
			return this.setCoins(++coins);
		},

		addConstruction: function (constuction) {
			++this[constuction.placeId];
			document.getElementById(constuction[placeId]).appendChild(constuction.e);
			this.repeat(constuction.createCoins, CREATE_INTERVAL, [], constuction);
			return this;
		},

		createCoin: function () {
			var rect = this.field.getBoundingClientRect(),
			    self = this;

			var coin = new Coin().on('click', function () {
				this.dissappear();
				self.addCoin();
			});
			coin.setStyle({
				position: 'absolute',
				left: [Math.random() * 100 * (1 - coin.e.naturalWidth / (rect.width || rect.right - rect.left)), '%'].join(''),
				top: [Math.random() * 100 * (1 - coin.e.naturalHeight / (rect.height || rect.bottom - rect.top)), '%'].join('')
			}).addClass('btn');

			this.field.appendChild(coin.e);
		},

		repeat: function (task, ms, args, context) {
			var self = this;

			this.timer.addTask(function () {
				task.apply(context || self, arguments);
				self.repeat(task, ms, args, context);
			}, when(ms), args, context || this);

			return this;
		},

		setCoins: function (value) {

			this.coins = value;

			var stat = document.getElementById('statistic');

			while (stat.childNodes.length)
				stat.removeChild(stat.firstChild);

			stat.appendChild(document.createTextNode(value));

			return this;
		},

		start: function () {
			console.log('Game Started');
			this.setCoins(INITIAL_COINS).repeat(this.createCoin, CREATE_INTERVAL, []).timer.start();
			return this;
		}
	}, Room);

	window.Room = Room;

})()