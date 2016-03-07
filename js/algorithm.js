(function () {
	"use strict";

	/*CONSTANTS*/
	var INITIAL_COINS = 10;
	var AIMED_COINS = 500;
	var FABRIC_COST = 20;
	var FACTORY_COST = 70;
	var MAX_FABRICS = 10;
	var MAX_FACTORIES = 5;
	var CREATE_INTERVAL = 5;

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

	function Coin () {
		Item.call(this, '../img/coin.png');
	}

	inheritPrototype(Interactive, Coin);

	function Construction (src) {
		Item.call(this, src);
	}

	function Fabric () {
		Construction.call(this, "../img/fabric.png");
	}

	function Factory () {
		Construction.call(this, "../img/factory.png");
	}


	function Button (elem) {
		this.e = elem;
	}

	inheritPrototype(Interactive, Button);

	function Room (elem) {
		this.e = elem;

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
			this.setCoins(INITIAL_COINS);
			return this;
		}
	}, Room);

	window.Room = Room;

})()