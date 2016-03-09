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
		/*Inherit or expand prototype*/
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

	/*Super class for items on the field*/
	function Item (src) {
		this.e = new Image();
		this.e.src = src;
	}

	inheritPrototype(Interactive, Item);

	/*The only ineractive item on the field is coin*/
	function Coin () {
		Item.call(this, '../img/coin.png');
	}

	inheritPrototype(Item, Coin);

	Coin.prototype.setStyle = function (style) {
		for (var key in style)
			this.e.style[key] = style[key];
		return this;
	};

	/*Class for buttons*/
	function Button (elem) {
		this.e = elem;
	}

	inheritPrototype(Interactive, Button);

	/*Disabling cover for interactive elements*/
	function Cover (elem) {
		this.e = elem;
	}

	inheritPrototype(Interactive, Cover);

	/*Class for construction creators*/
	function Creator (elem) {
		this.e = elem;

		if (!elem.dataset) {
			elem.dataset = {};
			var list = 'target,cost,max,depend,add'.split(',');
			for (var i = 0, l = list.length; i < l; ++i) {
				var key = list[i],
				    attr = elem.getAttribute(['data', key].join('-'));
				if (attr)
					elem.dataset[key] = attr;
			}
		}

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
			/*The only event creator uses is click event*/
			var self = this;
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
			/*Main method to create and place new construction*/
			var img = new Image();
			img.src = this.btn.e.src;
			this.target.appendChild(img);
			return this;
		}
	}, Creator);


	/*Timer manager*/
	function Timer (ms) {
		this.tasks = {};
		this.ms = ms || 100;
	}

	inheritPrototype({
		addTask: function (task, when, args, context) {
			/*Add task into shedule*/
			if (this.tasks[when])
				this.tasks[when].push({task: task, args: args, context: context});
			else
				this.tasks[when] = [{task: task, args: args, context: context}];
			return this;
		},

		complete: function () {
			/*Complete all tasks wich the time has comme for*/
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
			/*Set new interval for check shedule*/
			if (this.interval)
				return this;
			var self = this;
			this.interval = setInterval(function () {self.complete.call(self);}, this.ms);
			return this;
		},

		start: function () {
			/*Start timer*/
			return this.setInterval();
		},

		stop: function () {
			/*Stop timer*/
			if (!this.interval)
				return this;

			clearInterval(this.interval);
			delete this.interval;

			return this;
		}
	}, Timer);

	/*Main game manager*/
	function Room (elem) {

		this.e = elem;

		this.field = document.getElementById('field');

		this.store = document.getElementById('store');

		this.creators = []; /*Construction creators list*/

		this.timer = new Timer(200);

		var self = this;

		/*Initialize creators list*/
		var creators = this.store.getElementsByClassName('creator');

		for (var i = 0, l = creators.length; i < l; ++i) {
			var creator = new Creator(creators[i]);
			(function (creator) {
				creator.onclick(function () {
					creator.construct();
					self.setCoins(self.coins - creator.cost)
						.repeat(function () {
						for (var i = 0; i < creator.add; ++i)
							this.createCoin();
					}, CREATE_INTERVAL, [], self);
				});
			})(creator);
			this.creators.push(creator);
		}
		
		/*Add start button*/
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
			/*Increese got coins number*/
			var coins = this.coins || 0;
			return this.setCoins(++coins);
		},

		createCoin: function () {
			/*Create new coin*/
			var rect = this.field.getBoundingClientRect(),
			    self = this;

			/*By click event the coin must dissapear and increase coins number in the bank*/
			var coin = new Coin().on('click', function () {
				this.dissappear();
				self.addCoin();
			});

			/*Place coin into rangom place on the field*/
			coin.setStyle({
				position: 'absolute',
				left: [Math.random() * 100 * (1 - coin.e.naturalWidth / (rect.width || rect.right - rect.left)), '%'].join(''),
				top: [Math.random() * 100 * (1 - coin.e.naturalHeight / (rect.height || rect.bottom - rect.top)), '%'].join('')
			}).addClass('btn');

			this.field.appendChild(coin.e);
		},

		repeat: function (task, ms, args, context) {
			/*Add task into game's shedule*/
			var self = this;

			this.timer.addTask(function () {
				task.apply(context || self, arguments);
				self.repeat(task, ms, args, context);
			}, Date.now() + ms, args, context || this);

			return this;
		},

		setCoins: function (value) {
			/*Set coin number in the bank*/
			this.coins = value;

			var stat = document.getElementById('statistic');

			while (stat.childNodes.length)
				stat.removeChild(stat.firstChild);

			stat.appendChild(document.createTextNode(value));

			return this.update();
		},

		start: function () {
			/*Start the game*/
			this.setCoins(INITIAL_COINS)
				.repeat(this.createCoin, CREATE_INTERVAL, []) /*Add task to create 1 coin every CREATE_INTERVAL ms*/
				.timer.start(); //And start timer
			return this;
		},

		stop: function () {
			/*Finish the game*/
			this.timer.stop(); //Stop timer

			/*Disable all creators*/
			for (var i = 0, l = this.creators.length; i < l; ++i) {
				var c = this.creators[i];
				c.disable();
			}

			/*Disable the field and all coins*/
			var cover = document.createElement('div');
			cover.className = 'field_cover';
			this.field.appendChild(cover);

			/*Finish image show*/
			this.field.appendChild(
				new Item('../img/win.png')
					.addClass('centered')
					.e
			);

			return this;
		},

		update: function () {
			/*Update game status*/

			/*Update creator's status*/
			for (var i = 0, l = this.creators.length; i < l; ++i) {
				var c = this.creators[i];
				c.enable(c.isDependsOk() && c.isFreePlace() && this.coins >= c.cost);
			}

			/*Finish game if coin number is enough*/
			if (this.coins === AIMED_COINS)
				this.stop();

			return this;
		}
	}, Room);

	window.onload = function () {
		/*GO!*/
		new Room (document.getElementById('room'));
		
	}

})()