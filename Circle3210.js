var VIKTORSAN = VIKTORSAN || {};

VIKTORSAN.Pelota = function(angle)
{
	this.pos = new THREE.Vector3(0,0,0);
	this.vel = new THREE.Vector3(Math.cos(angle)/10, Math.sin(angle)/10);
	this.rad = new THREE.Vector3(0.2,0.2,1);
	this.msh = new THREE.Mesh(new THREE.CircleGeometry(1,32), new THREE.MeshBasicMaterial({color: 0xFFFF00}));
	this.msh.scale.set(0.2,0.2,1);
	this.val = 3;
	this.sinChoque = true;
	this.parada = false;
}

VIKTORSAN.Pelota.prototype = {
	actualizaPelota: function()
	{
		this.vel.x = this.vel.x/1.03;
		this.vel.y = this.vel.y/1.03;
		this.pos.x += this.vel.x;
		this.pos.y += this.vel.y;

		if (Math.abs(this.pos.x) > 2)
		{
			this.vel.x = -this.vel.x;
			this.pos.x += this.vel.x;
			this.sinChoque = false;
		}

		if (Math.abs(this.pos.y) > 2)
		{
			this.vel.y = -this.vel.y;
			this.pos.y += this.vel.y;
			this.sinChoque = false;
		}

		this.msh.position.set(this.pos.x,this.pos.y,0);

		if ((Math.abs(this.vel.x) < 0.001) && (Math.abs(this.vel.y) < 0.001))
		{
			this.parada = true;
		}

		if ((Math.sqrt(Math.pow(this.pos.x,2)+Math.pow(this.pos.y,2)) < 0.3) && (!this.sinChoque))
		{
			return false;
		}
		return true;
	},

	defineEndRadius: function(pelotas)
	{
		var test = this;
		var minimo = Math.abs(test.pos.x +2.2);

		//busca en los laterales
		if (Math.abs(test.pos.y -2.2) < minimo) minimo = Math.abs(test.pos.y - 2.2);
		if (Math.abs(test.pos.y +2.2) < minimo) minimo = Math.abs(test.pos.y + 2.2);
		if (Math.abs(test.pos.x -2.2) < minimo) minimo = Math.abs(test.pos.x - 2.2);

		//busca en el centro (considerando el centro como un radio de 0.3)
		var distancia = Math.sqrt(Math.pow(test.pos.x,2)+Math.pow(test.pos.y,2))-0.3;
		if (distancia < minimo) minimo = distancia;

		//busca en el resto de pelotas
		for (var i = 0; i < (pelotas.length-1);i++)
		{
			distancia = Math.sqrt(Math.pow(test.pos.x-pelotas[i].pos.x,2)+Math.pow(test.pos.y-pelotas[i].pos.y,2))-pelotas[i].rad.x;
			if (distancia < minimo) minimo = distancia;
		}

		//finalmente mantenemos el minimo radio
		if (minimo < 0.2) minimo = 0.2;

		this.rad.set(minimo,minimo,1);
		this.msh.scale=this.rad;
	},

	compruebaChoques: function(posicion, radio)
	{
		var distancia = Math.sqrt(Math.pow((this.pos.x - posicion.x),2)+Math.pow((this.pos.y - posicion.y),2));
		var sumaRadios = this.rad.x + radio.x;

		if (distancia < sumaRadios)
		{
			var velocidadLineal = Math.sqrt(Math.pow(this.vel.x,2)+Math.pow(this.vel.y,2));
			var anguloDeChoque = Math.atan2(this.pos.y - posicion.y, this.pos.x - posicion.x);
			
			this.vel.x = velocidadLineal * Math.cos(anguloDeChoque);
			this.vel.y = velocidadLineal * Math.sin(anguloDeChoque);
			this.sinChoque = false;

			return true;
		}

		return false;

	}
};


VIKTORSAN.Game = function(canvas) {

	this.nuevoJuego = true;
	this.gameOver = false;
	
	this.escena = new THREE.Scene();

	this.render = new THREE.WebGLRenderer({antialias:true});
	this.render.setClearColor(0xCC0000, 1);
	this.render.setSize(500,500);

	this.camera = new THREE.PerspectiveCamera(45,1,0.1,100);
	this.camera.position.set(0, 0, 5);
	this.camera.lookAt(this.escena.position);
	this.escena.add(this.camera);

	this.disparador = new THREE.Mesh(new THREE.CircleGeometry(0.2,3), new THREE.MeshBasicMaterial({color: 0xCCCC00, wireframe: true}));
	this.disparador.scale.set(1,0.5,1);
	this.escena.add(this.disparador);

	this.limits = new THREE.Mesh( new THREE.TorusGeometry(0.3,0.05,3,32), new THREE.MeshBasicMaterial({color: 0xCCCC00, wireframe: true}));
	this.escena.add(this.limits);

	this.anguloDisparo = 0;
	this.pelotas = [];

	this.canvas = canvas;
	var $this = this;
	this.canvas.appendChild($this.render.domElement);
	this.canvas.addEventListener('mousedown', function (event) {$this.handleMouseDown(event)}, false);
}

VIKTORSAN.Game.prototype = {

	iniciarRender: function() {

		var $this = this;
		requestAnimationFrame( function() {$this.iniciarRender();} );
		this.anguloDisparo += 1.0/60.0;
		this.disparador.rotation.z=this.anguloDisparo;
		
		if (this.pelotas.length > 0) 
		{
			if (!this.pelotas[this.pelotas.length-1].actualizaPelota())
			{
				this.gameOver = true;
				this.nuevoJuego = false;
				this.render.setClearColor(0x000000, 1);
				for (var i=0; i<this.pelotas.length; i++)
				{
					this.escena.remove(this.pelotas[i].msh);
				}
			}
			for (var i = 0; i < this.pelotas.length-1; i++)
			{
				if (this.pelotas[this.pelotas.length-1].compruebaChoques(this.pelotas[i].pos,this.pelotas[i].rad))
				{
					this.pelotas[i].val --;
					switch (this.pelotas[i].val)
					{
					case 2:
						this.pelotas[i].msh.setMaterial(new THREE.MeshBasicMaterial({color: 0xFF9900}));
						break;
					case 1:
						this.pelotas[i].msh.setMaterial(new THREE.MeshBasicMaterial({color: 0xFF2200}));
						break;
					case 0:
						this.pelotas[i].pos.set(10,10,0);
						this.pelotas[i].msh.position.set(10,10,0);
						break;
					}
				}
			}
			if (this.pelotas[this.pelotas.length-1].parada)
			{
				this.pelotas[this.pelotas.length-1].defineEndRadius(this.pelotas);
			}
		}
		
		this.render.render(this.escena, this.camera);
	},

	handleMouseDown: function(event)
	{
		if (this.gameOver)
		{
			this.gameOver = false;
			this.nuevoJuego = true;
			this.render.setClearColor(0xCC0000, 1);
			this.pelotas = [];
		}
		else if (this.nuevoJuego)
		{
			this.nuevoJuego = false;
			var nuevaPelota = new VIKTORSAN.Pelota(this.anguloDisparo);
			this.escena.add(nuevaPelota.msh);
			this.pelotas.push(nuevaPelota);
		}
		else if (this.pelotas[this.pelotas.length-1].parada)
		{
			console.log("oye");
			var nuevaPelota = new VIKTORSAN.Pelota(this.anguloDisparo);
			this.escena.add(nuevaPelota.msh);
			this.pelotas.push(nuevaPelota);
		}
	}
};