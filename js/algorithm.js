(function () {
	"use strict";

	if (!Date.now)
		Date.now = function () {
			return (new Date()).getTime();
		}

	/*CONSTANTS*/
	var INITIAL_COINS = 10;
	var AIMED_COINS = 500;
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

	inheritPrototype(Interactive, Item);

	function Coin () {
		Item.call(this, '../img/coin.png');
	}

	inheritPrototype(Item, Coin);

	Coin.prototype.setStyle = function (style) {
		for (var key in style)
			this.e.style[key] = style[key];
		return this;
	};

	function Button (elem) {
		this.e = elem;
	}

	inheritPrototype(Interactive, Button);

	function Cover (elem) {
		this.e = elem;
	}

	inheritPrototype(Interactive, Cover);

	function Creator (elem) {
		this.e = elem;

		this.cost = +elem.dataset.cost;
		this.max = +elem.dataset.max;
		this.add = +elem.dataset.add;

		this.target = document.getElementById(elem.dataset.target);

		this.btn = new Button(this.e.getElementsByTagName('img')[0]);
		this.cover = new Cover(this.e.getElementsByClassName('cover')[0]);

	}

	inheritPrototype({
		disable: function (disable) {
			this.cover.show.apply(this.cover, arguments);
			return this;
		},

		enable: function (enable) {
			this.cover.hide.apply(this.cover, arguments);
			return this;
		},

		onclick: function (handler) {
			this.btn.on('click', handler);
			return this;
		},

		isDependsOk: function () {
			var depend = this.e.dataset.depend;
			if (!depend)
				return true;
			depend = depend.split(' ');

			for (var i = 0, l = depend.length; i < l; ++i) {
				var d = depend[i].split(':'),
				    tmp = document.getElementById(d[0]);
				if (!tmp || tmp.children.length < +d[1])
					return false;
			}
			return true;
		},

		isFreePlace: function() {
			return  this.target.children.length < this.max;
		},

		construct: function (room) {
			var img = new Image();
			img.src = this.btn.e.src;
			this.target.appendChild(img);
		}
	}, Creator);


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

		this.store = document.getElementById('store');

		this.creators = [];

		this.timer = new Timer(200);

		var self = this;

		var creators = this.store.getElementsByClassName('creator');

		for (var i = 0, l = creators.length; i < l; ++i) {
			var creator = new Creator(creators[i]);
			(function (creator) {
				creator.onclick(function () {
					self.setCoins(self.coins - creator.cost);
					creator.construct();
					self.repeat(function () {
						for (var i = 0; i < creator.add; ++i)
							this.createCoin();
					}, CREATE_INTERVAL, [], self);
				});
			})(creator);
			this.creators.push(creator);
		}
		
		this.field.appendChild(
			new Item('../img/start_btn.png')
				.addClass('centered')
				.addClass('btn')
				.on('click', function () {
					this.dissappear();
					self.start();
				})
				.e
		);
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
			}, Date.now() + ms, args, context || this);

			return this;
		},

		setCoins: function (value) {

			this.coins = value;

			var stat = document.getElementById('statistic');

			while (stat.childNodes.length)
				stat.removeChild(stat.firstChild);

			stat.appendChild(document.createTextNode(value));

			for (var i = 0, l = this.creators.length; i < l; ++i) {
				var c = this.creators[i];
				c.enable(c.isDependsOk() && c.isFreePlace() && this.coins >= c.cost);
			}

			if (this.coins === AIMED_COINS)
				this.stop();

			return this;
		},

		start: function () {
			this.setCoins(INITIAL_COINS)
				.repeat(this.createCoin, CREATE_INTERVAL, [])
				.timer.start();
			return this;
		},

		stop: function () {

			this.timer.stop();

			for (var i = 0, l = this.creators.length; i < l; ++i) {
				var c = this.creators[i];
				c.disable();
			}

			var cover = document.createElement('div');
			cover.className = 'field_cover';
			this.field.appendChild(cover);

			this.field.appendChild(
				new Item('../img/win.png')
					.addClass('centered')
					.e
			);

			return this;		}
	}, Room);

	window.onload = function () {
		new Room (document.getElementById('room'));
		
	}

})()