(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
AFRAME.registerElement('a-asset-image', {
  prototype: Object.create(AFRAME.ANode.prototype, {
    createdCallback: {
      value: function () {
        this.isAssetItem = true;
      }
    },

    attachedCallback: {
      value: function () {
        var src = this.getAttribute('src');
        var textureLoader = new THREE.ImageLoader();
        textureLoader.load(src, this.onImageLoaded.bind(this));
      }
    },

    onImageLoaded: {
      value : function () {
        AFRAME.ANode.prototype.load.call(this);
      }
    }
  })
});
},{}],2:[function(require,module,exports){
require('../systems/bullet.js');
/* globals ABLAST */
ABLAST.registerBullet(
  // name
  'default',
  // data
  {
    components: {
      bullet: {
        name: 'default',
        maxSpeed: 1,
        initialSpeed: 0.1,
        acceleration: 0.4,
        color: '#24CAFF'
      },
      'collision-helper': {
        debug: false,
        radius: 0.2
      },
      'json-model': {
        src: '#playerBullet'
      }
    },
    poolSize: 10
  },
  // implementation
  {
    init: function () {
		var el = this.el;
		var color = this.bullet.components.bullet.color;
		el.setAttribute('material', 'color', color);
		el.setAttribute('scale', {x: 0.2, y: 0.2, z: 0.2});
		el.setAttribute('dynamic-body','mass: 0.1, shape:sphere');
		el.addEventListener('collide', function (e) {
			console.log('Bullet hit body #' + e.detail.body.id);
			  
			e.detail.target.el;  // Original entity (playerEl).
			e.detail.body.el;    // Other entity, which playerEl touched.
			e.detail.contact;    // Stats about the collision (CANNON.ContactEquation).
			e.detail.contact.ni; // Normal (direction) of the collision (CANNON.Vec3).
			  
			setTimeout(function(){el.components.bullet.hitObject(null, null);}, 0);
			console.log('reset bullet');
		  
		});
      this.trail = null;
      var self = this;
      el.addEventListener('model-loaded', function(event) {
        // @todo Do it outside
        //event.detail.model.children[0].material.color.setRGB(1,0,0);
        self.trail = self.el.getObject3D('mesh').getObjectByName('trail');
        self.trail.scale.setY(0.001);
      });
    },
    reset: function () {
		console.log('resetting bullet');
      var el = this.el;
      el.setAttribute('scale', {x: 0.2, y: 0.2, z: 0.2});
      if (this.trail) {
        this.trail.scale.setY(0.001);
      }
		//RESET DYNAMIC PROPERTIES
		setTimeout(function()
		{
			var body = el.body
			// Position
			//body.position.setZero();
			//body.previousPosition.setZero();
			//body.interpolatedPosition.setZero();
			//body.initPosition.setZero();

			// orientation
			//body.quaternion.set(0,0,0,1);
			//body.initQuaternion.set(0,0,0,1);
			//body.previousQuaternion.set(0,0,0,1);
			//body.interpolatedQuaternion.set(0,0,0,1);

			// Velocity
			body.velocity.setZero();
			body.initVelocity.setZero();
			body.angularVelocity.setZero();
			body.initAngularVelocity.setZero();

			// Force
			body.force.setZero();
			body.torque.setZero();

			// Sleep state reset
			body.sleepState = 0;
			body.timeLastSleepy = 0;
			body._wakeUpAfterNarrowphase = false;
		},0);
    },
    tick: function (time, delta) {
      //stretch trail
      if (this.trail && this.trail.scale.y < 1) {
        var trailScale;
        if (this.trail.scale.y < 0.005) {
          trailScale = this.trail.scale.y + 0.001;
        }
        else {
          trailScale = this.trail.scale.y + delta/50;
        }
        if (trailScale > 1) { trailScale = 1; }
        this.trail.scale.setY(trailScale);
      }
    },
    onHit: function (type) {
      this.el.setAttribute('material', 'color', '#FFF');
    }
  }
);
},{"../systems/bullet.js":13}],3:[function(require,module,exports){
/* globals AFRAME ABLAST THREE */
AFRAME.registerComponent('bullet', {
  schema: {
    name: { default: '' },
    direction: { type: 'vec3' },
    maxSpeed: { default: 5.0 },
    initialSpeed: { default: 5.0 },
    position: { type: 'vec3' },
    acceleration: { default: 0.5 },
    destroyable: { default: false },
    owner: {default: 'player', oneOf: ['enemy', 'player']},
    color: {default: '#fff'}
  },

  init: function () {
    //this.startEnemy = document.getElementById('start_enemy');
    //this.backgroundEl = document.getElementById('border');
    this.bullet = ABLAST.BULLETS[this.data.name];
    this.bullet.definition.init.call(this);
    this.hit = false;
    this.direction = new THREE.Vector3();
    this.temps = {
      direction: new THREE.Vector3(),
      position: new THREE.Vector3()
    }
  },

  update: function (oldData) {
    var data = this.data;
    this.owner = this.data.owner;
    this.direction.set(data.direction.x, data.direction.y, data.direction.z);
    this.currentAcceleration = data.acceleration;
    this.speed = data.initialSpeed;
    this.startPosition = data.position;
  },

  play: function () {
    this.initTime = null;
  },

  hitObject: function (type, data) {
	if(this.hit==true) return;
    this.bullet.definition.onHit.call(this);
    this.hit = true;
    /*if (this.data.owner === 'enemy') {
      this.el.emit('player-hit');
      document.getElementById('hurtSound').components.sound.playSound();
    }
    else {
      if (type === 'bullet') {
        // data is the bullet entity collided with
        data.components.bullet.resetBullet();
        this.el.sceneEl.systems.explosion.createExplosion(type, data.object3D.position, data.getAttribute('bullet').color, 1, this.direction);
        ABLAST.currentScore.validShoot++;
      }
      else if (type === 'background') {
        this.el.sceneEl.systems.decals.addDecal(data.point, data.face.normal);
        var posOffset = data.point.clone().sub(this.direction.clone().multiplyScalar(0.2));
        this.el.sceneEl.systems.explosion.createExplosion(type, posOffset, '#fff', 1, this.direction);
      }
      else if (type === 'enemy') {
        var enemy = data.getAttribute('enemy');
        if (data.components['enemy'].health <= 0) {
          this.el.sceneEl.systems.explosion.createExplosion('enemy', data.object3D.position, enemy.color, enemy.scale, this.direction, enemy.name);
        }
        else {
          this.el.sceneEl.systems.explosion.createExplosion('bullet', this.el.object3D.position, enemy.color, enemy.scale, this.direction);
        }
        ABLAST.currentScore.validShoot++;
      }
    }*/
    this.resetBullet();
  },

  resetBullet: function () {
    this.hit = false;
    this.bullet.definition.reset.call(this);
    this.initTime = null;

    this.direction.set(this.data.direction.x, this.data.direction.y, this.data.direction.z);

    this.currentAcceleration = this.data.acceleration;
    this.speed = this.data.initialSpeed;
    this.startPosition = this.data.position;

    this.system.returnBullet(this.data.name, this.el);
  },

  tick: (function () {
    //var position = new THREE.Vector3();
    //var direction = new THREE.Vector3();
    return function tick (time, delta) {

      /*if (!this.initTime) {this.initTime = time;}

      this.bullet.definition.tick.call(this, time, delta);

      // Align the bullet to its direction
      //this.el.object3D.lookAt(this.direction.clone().multiplyScalar(1000));

      // Update acceleration based on the friction
      this.temps.position.copy(this.el.getAttribute('position'));

      // Update speed based on acceleration
      this.speed = this.currentAcceleration * .1 * delta;
      if (this.speed > this.data.maxSpeed) { this.speed = this.data.maxSpeed; }

      // Set new position
      this.temps.direction.copy(this.direction);
      var newBulletPosition = this.temps.position.add(this.temps.direction.multiplyScalar(this.speed));
      this.el.setAttribute('position', newBulletPosition);

      // Check if the bullet is lost in the sky
      //if (this.temps.position.length() >= 50) {
      //  this.resetBullet();
      //  return;
      //}

      //var collisionHelper = this.el.getAttribute('collision-helper');
     // if (!collisionHelper) { return; }

      //var bulletRadius = collisionHelper.radius;

      // Detect collision depending on the owner
      if (this.data.owner === 'player') {
        // megahack

        // Detect collision against enemies
        if (this.data.owner === 'player') {
          // Detect collision with the start game enemy
          /*var state = this.el.sceneEl.getAttribute('gamestate').state;
          if (state === 'STATE_MAIN_MENU') {
            var enemy = this.startEnemy;
            var helper = enemy.getAttribute('collision-helper');
            var radius = helper.radius;
            if (newBulletPosition.distanceTo(enemy.object3D.position) < radius + bulletRadius) {
              this.el.sceneEl.systems.explosion.createExplosion('enemy', this.el.getAttribute('position'), '#ffb911', 0.5, this.direction, 'enemy_start');
              enemy.emit('hit');
              document.getElementById('introMusic').components.sound.pauseSound();
              document.getElementById('mainThemeMusic').components.sound.playSound();
              return;
            }
          } else if (state === 'STATE_GAME_WIN' || state === 'STATE_GAME_OVER') {
            var enemy = document.getElementById('reset');
            var helper = enemy.getAttribute('collision-helper');
            var radius = helper.radius;
            if (newBulletPosition.distanceTo(enemy.object3D.position) < radius * 2 + bulletRadius * 2) {
              this.el.sceneEl.systems.explosion.createExplosion('enemy', this.el.getAttribute('position'), '#f00', 0.5, this.direction, 'enemy_start');
              this.el.sceneEl.emit('reset');
              return;
            }
          } else {
            // Detect collisions with all the active enemies
            var enemies = this.el.sceneEl.systems.enemy.activeEnemies;
            for (var i = 0; i < enemies.length; i++) {
              var enemy = enemies[i];
              var helper = enemy.getAttribute('collision-helper');
              if (!helper) continue;
              var radius = helper.radius;
              if (newBulletPosition.distanceTo(enemy.object3D.position) < radius + bulletRadius) {
                enemy.emit('hit');
                this.hitObject('enemy', enemy);
                return;
              }
            }
          }*/

          /*var bullets = this.system.activeBullets;
          for (var i = 0; i < bullets.length; i++) {
            var bullet = bullets[i];
            var data = bullet.components['bullet'].data;
            if (!data || data.owner === 'player' || !data.destroyable) { continue; }

            var colhelper = bullet.components['collision-helper'];
            if (!colhelper) continue;
            var enemyBulletRadius = colhelper.data.radius;
            if (newBulletPosition.distanceTo(bullet.getAttribute('position')) < enemyBulletRadius + bulletRadius) {
              this.hitObject('bullet', bullet);
              return;
            }
          }
		  
		  
        }
      } else {
        // @hack Any better way to get the head position ?
        /*var head = this.el.sceneEl.camera.el.components['look-controls'].dolly.position;
        if (newBulletPosition.distanceTo(head) < 0.10 + bulletRadius) {
          this.hitObject('player');
          return;
        }
      }*/

      // Detect collission aginst the background
     /* var ray = new THREE.Raycaster(this.temps.position, this.temps.direction.clone().normalize());
      var background = this.backgroundEl.getObject3D('mesh');
      if (background) {
        var collisionResults = ray.intersectObjects(background.children, true);
        var self = this;
        collisionResults.forEach(function (collision) {
          if (collision.distance < self.temps.position.length()) {
            if (!collision.object.el) { return; }
            self.hitObject('background', collision);
            return;
          }
        });
      }*/
    };
  })()
});
},{}],4:[function(require,module,exports){
/* globals AFRAME THREE */
AFRAME.registerComponent('collision-helper', {
  schema: {
    type: {default: 'sphere', oneOf: ['sphere', 'box']},
    radius: {default: 1, if: {type: ['sphere']}},
    debug: {default: false},
    color: {type: 'color', default: 0x888888}
  },

  init: function () {
    var data = this.data;

    this.geometry = new THREE.IcosahedronGeometry(1, 1);
    this.material = new THREE.MeshBasicMaterial({color: data.color, wireframe: true});
    this.helperMesh = null;

    if (data.debug) {
      this.createHelperMesh();
    }
  },

  createHelperMesh: function () {
    var radius = this.data.radius;
    this.helperMesh = new THREE.Mesh(this.geometry, this.material);
    this.helperMesh.visible = true;
    this.helperMesh.scale.set(radius, radius, radius);
    this.el.setObject3D('collision-helper-mesh', this.helperMesh);
  },

  update: function (oldData) {
    var data = this.data;
    if (!data.debug) { return; }

    if (!this.helperMesh) {
      this.createHelperMesh();
    } else {
      this.material.color.set(data.color);
      this.helperMesh.scale.set(data.radius, data.radius, data.radius);
      this.helperMesh.visible = data.debug;
    }
  }
});
},{}],5:[function(require,module,exports){
var WEAPONS = require('./weapon');

AFRAME.registerComponent('shoot', {
  schema: {
    direction: {type: 'vec3', default: {x: 0, y: -2, z: -1}},  // Event to fire bullet.
    on: {default: 'triggerdown'},  // Event to fire bullet.
    spaceKeyEnabled: {default: false},  // Keyboard support.
    weapon: {default: 'default'}  // Weapon definition.
  },

  init: function () {
    var data = this.data;
    var el = this.el;
    var self = this;

    this.coolingDown = false;  // Limit fire rate.
    this.shoot = this.shoot.bind(this);
    this.weapon = null;

    // Add event listener.
    if (data.on) { el.addEventListener(data.on, this.shoot); }

    // Add keyboard listener.
    if (data.spaceKeyEnabled) {
      window.addEventListener('keydown', function (evt) {
        if (evt.code === 'Space' || evt.keyCode === '32') { self.shoot(); }
      });
    }
/*
    if (AFRAME.utils.device.isMobile())
    {
      window.addEventListener('click', function (evt) {
        self.shoot();
      });
    }
*/
  },

  update: function (oldData) {
    // Update weapon.
    this.weapon = WEAPONS[this.data.weapon];

    if (oldData.on !== this.data.on) {
      this.el.removeEventListener(oldData.on, this.shoot);
      this.el.addEventListener(this.data.on, this.shoot);
    }
  },

  shoot: (function () {
    var direction = new THREE.Vector3();
    var position = new THREE.Vector3();
    var quaternion = new THREE.Quaternion();
    var scale = new THREE.Vector3();
    var translation = new THREE.Vector3();
    var incVive = new THREE.Vector3(0.0, -0.23, -0.15);
    var incOculus = new THREE.Vector3(0, -0.23, -0.8);
    var inc = new THREE.Vector3();

    return function () {
      var bulletEntity;
      var el = this.el;
      var data = this.data;
      var matrixWorld;
      var self = this;
      var weapon = this.weapon;

      if (this.coolingDown) { return; }

      //ABLAST.currentScore.shoots++;

      // Get firing entity's transformations.
      el.object3D.updateMatrixWorld();
      matrixWorld = el.object3D.matrixWorld;
      position.setFromMatrixPosition(matrixWorld);
      matrixWorld.decompose(translation, quaternion, scale);

      // Set projectile direction.
      direction.set(data.direction.x, data.direction.y, data.direction.z);
      direction.applyQuaternion(quaternion);
      direction.normalize();

      if (el.components['weapon']) {
        inc.copy(el.components.weapon.controllerModel === 'oculus-touch-controller' ? incOculus : incVive);
      }
      inc.applyQuaternion(quaternion);
      position.add(inc);

      // Ask system for bullet and set bullet position to starting point.
      bulletEntity = el.sceneEl.systems.bullet.getBullet(weapon.bullet);
      bulletEntity.setAttribute('position', position);
      bulletEntity.setAttribute('bullet', {
        direction: direction.clone(),
        position: position.clone(),
        owner: 'player'
      });
	  
	  //HERE
	  setTimeout(function()
		{
			bulletEntity.body.applyImpulse(new CANNON.Vec3().copy(direction).scale(1), new CANNON.Vec3().copy(position));
		},0);
	  
	  
	  bulletEntity.setAttribute('visible', true);
      bulletEntity.setAttribute('position', position);
	  
      bulletEntity.play();

      // Communicate the shoot.
      el.emit('shoot', bulletEntity);

      // Set cooldown period.
      this.coolingDown = true;
      setTimeout(function () {
        self.coolingDown = false;
      }, weapon.shootingDelay);
    };
  })()
});
},{"./weapon":9}],6:[function(require,module,exports){

/* global AFRAME THREE */
AFRAME.registerComponent('headset', {
  schema: {
    on: { default: 'click' }
  },

  init: function () {
  },

  tick: function (time, delta) {
    var mesh = this.el.getObject3D('mesh');
    if (mesh) {
      mesh.update(delta / 1000);
    }
    this.updatePose();
    this.updateButtons();
  },

  updatePose: (function () {
    var controllerEuler = new THREE.Euler();
    var controllerPosition = new THREE.Vector3();
    var controllerQuaternion = new THREE.Quaternion();
    var dolly = new THREE.Object3D();
    var standingMatrix = new THREE.Matrix4();
    controllerEuler.order = 'YXZ';
    return function () {
      var controller;
      var pose;
      var orientation;
      var position;
      var el = this.el;
      var vrDisplay = this.system.vrDisplay;
      this.update();
      controller = this.controller;
      if (!controller) { return; }
      pose = controller.pose;
      orientation = pose.orientation || [0, 0, 0, 1];
      position = pose.position || [0, 0, 0];
      controllerQuaternion.fromArray(orientation);
      dolly.quaternion.fromArray(orientation);
      dolly.position.fromArray(position);
      dolly.updateMatrix();
      if (vrDisplay && vrDisplay.stageParameters) {
        standingMatrix.fromArray(vrDisplay.stageParameters.sittingToStandingTransform);
        dolly.applyMatrix(standingMatrix);
      }
      controllerEuler.setFromRotationMatrix(dolly.matrix);
      controllerPosition.setFromMatrixPosition(dolly.matrix);
      el.setAttribute('rotation', {
        x: THREE.Math.radToDeg(controllerEuler.x),
        y: THREE.Math.radToDeg(controllerEuler.y),
        z: THREE.Math.radToDeg(controllerEuler.z)
      });
      el.setAttribute('position', {
        x: controllerPosition.x,
        y: controllerPosition.y,
        z: controllerPosition.z
      });
    };
  })()
});
},{}],7:[function(require,module,exports){
/* globals AFRAME THREE */
AFRAME.registerComponent('json-model', {
  schema: {
    src: {type: 'asset'},
    singleModel: {default: false},
    texturePath: {type: 'asset', default: ''},
    debugNormals: {default: false},
    debugNormalsLength: {default: 0.2},
    debugBones: {default: false}
  },

  init: function () {
  },

  fixNormal: function (vector) {
    var t = vector.y;
    vector.y = -vector.z;
    vector.z = t;
  },

  update: function (oldData) {
    this.loader = null;
    this.helpers = new THREE.Group();
    this.mixers = [];
    this.animationNames = [];
    this.skeletonHelper = null;

    var src = this.data.src;
    if (!src || src === oldData.src) { return; }

    if (this.data.singleModel) {
      this.loader = new THREE.JSONLoader();
      this.loader.setTexturePath(this.data.texturePath);
      this.loader.load(src, this.onModelLoaded.bind(this));
    }
    else {
      this.loader = new THREE.ObjectLoader();
      this.loader.setCrossOrigin('');
      this.loader.load(src, this.onSceneLoaded.bind(this));
    }
  },

  onModelLoaded: function(geometry, materials) {
    this.helpers = new THREE.Group();

    var mesh = new THREE.SkinnedMesh(geometry, materials[0]);
    var self = this;
    mesh.geometry.faces.forEach(function(face) {
      face.vertexNormals.forEach(function(vertex) {
        if (!vertex.hasOwnProperty('fixed')) {
          self.fixNormal(vertex);
          vertex.fixed = true;
        }
      });
    });

    if (mesh.geometry['animations'] !== undefined && mesh.geometry.animations.length > 0){
      mesh.material.skinning = true;
      var mixer = {mixer: new THREE.AnimationMixer(mesh), clips: {}};
      for (var i in mesh.geometry.animations) {
        var anim = mesh.geometry.animations[i];
        var clip = mixer.mixer.clipAction(anim).stop();
        clip.setEffectiveWeight(1);
        mixer.clips[anim.name] = clip;
      }
      this.mixers.push(mixer);
    }

    self.addNormalHelpers(mesh);

    this.helpers.visible = this.data.debugNormals;
    this.el.setObject3D('helpers', this.helpers);

    this.skeletonHelper = new THREE.SkeletonHelper( mesh );
    this.skeletonHelper.material.linewidth = 2;
    this.el.setObject3D('skelhelper', this.skeletonHelper );
    this.skeletonHelper.visible = this.data.debugBones;

    this.el.setObject3D('mesh', mesh);
    this.el.emit('model-loaded', {format: 'json', model: mesh, src: this.data.src});
  },

  onSceneLoaded: function(group) {
    this.helpers = new THREE.Group();

    if (group['animations'] !== undefined) {
      var mixer = {mixer: new THREE.AnimationMixer(group), clips: {}};
      for (var i in group.animations) {
        var anim = group.animations[i];
        var clip = mixer.mixer.clipAction(anim).stop();
        mixer.clips[anim.name] = clip;
      }
      this.mixers.push(mixer);
    }
    var self = this;
    group.traverse(function (child) {
      if (!(child instanceof THREE.Mesh)) { return; }

      child.geometry.faces.forEach(function(face) {
        face.vertexNormals.forEach(function(vertex) {
          if (!vertex.hasOwnProperty('fixed')) {
            self.fixNormal(vertex);
            vertex.fixed = true;
          }
        });
      });

      self.addNormalHelpers(child);
    });

    this.helpers.visible = this.data.debugNormals;
    this.el.setObject3D('helpers', this.helpers);
    this.el.setObject3D('mesh', group);
    this.el.emit('model-loaded', {format: 'json', model: group, src: this.data.src});
  },

  addNormalHelpers: function (mesh) {
    var fnh = new THREE.FaceNormalsHelper(mesh, this.data.debugNormalsLength);
    this.helpers.add(fnh);
    var vnh = new THREE.VertexNormalsHelper(mesh, this.data.debugNormalsLength);
    this.helpers.add(vnh);

    mesh.geometry.normalsNeedUpdate = true;
    mesh.geometry.verticesNeedUpdate = true;
  },

  playAnimation: function (animationName, repeat) {
    for (var i in this.mixers) {
      var clip = this.mixers[i].clips[animationName];
      if (clip === undefined) continue;
      clip.stop().play();
      var repetitions = 0;
      if (repeat === true) repetitions = Infinity;
      else if (repeat == undefined) repeat = false;
      else if (typeof(repeat) == 'number') {
        if (repeat === 0) repeat = false;
        repetitions = repeat;
      }
      else repeat = false;
      clip.setLoop( repeat ? THREE.LoopRepeat : THREE.LoopOnce, repetitions );
    }
  },

  stopAnimation: function () {
    for (var i in this.mixers) {
      for (var j in this.mixers[i].clips) {
        this.mixers[i].clips[j].stop();
      }
    }
  },

  tick: function(time, timeDelta) {
    for (var i in this.mixers) {
      this.mixers[i].mixer.update( timeDelta / 1000 );
    }
    if (this.skeletonHelper) {
      this.skeletonHelper.update();
    }
  }
});
},{}],8:[function(require,module,exports){
/* global AFRAME */
AFRAME.registerComponent('shoot-controls', {
  // dependencies: ['tracked-controls'],
  schema: {
    hand: { default: 'left' }
  },

  init: function () {
    var self = this;

    this.onButtonChanged = this.onButtonChanged.bind(this);
    this.onButtonDown = function (evt) { self.onButtonEvent(evt.detail.id, 'down'); };
    this.onButtonUp = function (evt) { self.onButtonEvent(evt.detail.id, 'up'); };
  },

  play: function () {
    var el = this.el;
    el.addEventListener('buttonchanged', this.onButtonChanged);
    el.addEventListener('buttondown', this.onButtonDown);
    el.addEventListener('buttonup', this.onButtonUp);
  },

  pause: function () {
    var el = this.el;
    el.removeEventListener('buttonchanged', this.onButtonChanged);
    el.removeEventListener('buttondown', this.onButtonDown);
    el.removeEventListener('buttonup', this.onButtonUp);
  },

  // buttonId
  // 0 - trackpad
  // 1 - trigger ( intensity value from 0.5 to 1 )
  // 2 - grip
  // 3 - menu ( dispatch but better for menu options )
  // 4 - system ( never dispatched on this layer )
  mapping: {
    axis0: 'trackpad',
    axis1: 'trackpad',
    button0: 'trackpad',
    button1: 'trigger',
    button2: 'grip',
    button3: 'menu',
    button4: 'system'
  },

  onButtonChanged: function (evt) {
    var buttonName = this.mapping['button' + evt.detail.id];
    if (buttonName !== 'trigger') { return; }
    var value = evt.detail.state.value;
    this.el.components['weapon'].setTriggerPressure(value);
  },

  onButtonEvent: function (id, evtName) {
    var buttonName = this.mapping['button' + id];
    this.el.emit(buttonName + evtName);
  },

  update: function () {
    var data = this.data;
    var el = this.el;
    el.setAttribute('vive-controls', {hand: data.hand, model: false});
    el.setAttribute('oculus-touch-controls', {hand: data.hand, model: false});
    el.setAttribute('windows-motion-controls', {hand: data.hand, model: false});
    if (data.hand === 'right') {
      el.setAttribute('daydream-controls', {hand: data.hand, model: false});
      el.setAttribute('gearvr-controls', {hand: data.hand, model: false});
    }
  }
});
},{}],9:[function(require,module,exports){
// Weapon definitions.
var WEAPONS = {
  default: {
    model: {
      url: 'url(assets/models/gun.json)',
      positionOffset: [0, 0, 0],
      rotationOffset: [0, 0, 0]
    },
    shootSound: 'url(assets/sounds/gun.ogg)',
    shootingDelay: 100, // In ms
    bullet: 'default'
  }
};


/**
 * Tracked controls, gun model, firing animation, shooting effects.
 */
AFRAME.registerComponent('weapon', {
  dependencies: ['shoot-controls'],

  schema: {
    enabled: { default: true },
    type: { default: 'default' }
  },

  updateWeapon: function () {
    console.log(this.controllerModel);
    if (this.controllerModel === 'oculus-touch-controller') {
      this.model.applyMatrix(new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), 0.8));
      this.el.setAttribute('shoot', {direction: '0 -0.3 -1'});
    } else if (this.controllerModel === 'daydream-controls') {
      document.getElementById('rightHandPivot').setAttribute('position', '-0.2 0 -0.5');
      this.el.setAttribute('shoot', {on: 'trackpaddown'});
    }
  },
  init: function () {
    var el = this.el;
    var self = this;

    this.model = null;
    this.isGamepadConnected = false;
    this.controllerModel = null;
    this.weapon = WEAPONS[ this.data.type ];

    el.setAttribute('json-model', {src: this.weapon.model.url});

    el.setAttribute('sound', {
      src: this.weapon.shootSound,
      on: 'shoot',
      volume: 0.5,
      poolSize: 10
    });

    this.fires = [];
    this.trigger = null;

    el.addEventListener('controllerconnected', function (evt) {
      console.log(evt);
      self.controllerModel = evt.detail.name;
      if (self.model == null) {
        self.isGamepadConnected = true;
      } else {
        self.updateWeapon();
      }
    });

    el.addEventListener('model-loaded', function (evt) {
      this.model = evt.detail.model;
      var modelWithPivot = new THREE.Group();
      modelWithPivot.add(this.model);
      el.setObject3D('mesh', modelWithPivot);

      for (var i = 0; i < 3; i++){
        var fire = this.model.getObjectByName('fire'+i);
        if (fire) {
          fire.material.depthWrite = false;
          fire.visible = false;
          this.fires.push(fire);
        }
      }

      if (this.isGamepadConnected) {
        this.updateWeapon();
      }

      this.trigger = this.model.getObjectByName('trigger');

    }.bind(this));

    var self = this;
    el.addEventListener('shoot', function (evt) {
      el.components['json-model'].playAnimation('default');
      self.light.components.light.light.intensity = self.lightIntensity;
      for (var i in self.fires){
        self.fires[i].visible = true;
        self.fires[i].life = 50 + Math.random() * 100;
      }
    });

    this.lightIntensity = 3.0;
    this.life = this.data.lifespan;
    this.canShoot = true;

    this.light = document.createElement('a-entity');
    el.appendChild(this.light);

    this.light.setAttribute('light', {color: '#24CAFF', intensity: 0.0, type: 'point'});
    this.light.setAttribute('position', {x: 0, y: -0.22, z: -0.14});
    var self = this;
    this.light.addEventListener('loaded', function () {
      self.lightObj = self.light.components.light.light; // threejs light
    })
  },

  tick: function (time, delta) {
    if (this.lightObj && this.lightObj.intensity > 0.0) {
      this.light.visible = true;
      this.lightObj.intensity -= delta / 1000 * 10;
      if (this.lightObj.intensity < 0.0) {
        this.lightObj.intensity = 0.0;
        this.light.visible = false;
      }
      for (var i in this.fires) {
        if (!this.fires[i].visible) continue;
        this.fires[i].life -= delta;
        if (i == 0) {
          this.fires[i].rotation.set(0, Math.random() * Math.PI * 2, 0);
        }
        else {
          this.fires[i].rotation.set(0, Math.random() * 1 - 0.5 + (Math.random() > 0.5 ? Math.PI: 0) , 0);
        }
        if (this.fires[i].life < 0){
          this.fires[i].visible = false;
        }
      }
    }
  },

  update: function () {
    var data = this.data;
    this.weapon = WEAPONS[ data.type ];
  },

  setTriggerPressure: function (pressure) {
    if (this.trigger) {
      this.trigger.position.setY(pressure * 0.01814);
    }
  }
});

module.exports = WEAPONS;
},{}],10:[function(require,module,exports){
window.ABLAST = {};

require('./a-asset-image.js');

require('./components/bullet.js');
require('./components/collision-helper.js');
require('./components/gun.js');
require('./components/headset.js');
require('./components/json-model.js');
require('./components/shoot-controls.js');
require('./components/weapon.js');

require('./bullets/player.js');

require('./lib/poolhelper.js');
require('./lib/utils.js');

require('./systems/bullet.js');
},{"./a-asset-image.js":1,"./bullets/player.js":2,"./components/bullet.js":3,"./components/collision-helper.js":4,"./components/gun.js":5,"./components/headset.js":6,"./components/json-model.js":7,"./components/shoot-controls.js":8,"./components/weapon.js":9,"./lib/poolhelper.js":11,"./lib/utils.js":12,"./systems/bullet.js":13}],11:[function(require,module,exports){
var createMixin = require('./utils').createMixin;

var PoolHelper = function (groupName, data, sceneEl) {
  this.groupName = groupName;
  this.sceneEl = sceneEl || document.querySelector('a-scene');
  this.initializePools(groupName, data);
};

PoolHelper.prototype = {
  initializePools: function (groupName, data) {
    var self = this;
    Object.keys(data).forEach(function (name) {
      var item = data[name];
      var components = item.components;
      var mixinName = groupName + name;
      createMixin(mixinName, components, self.sceneEl);

      self.sceneEl.setAttribute('pool__' + mixinName,
        {
          size: item.poolSize,
          mixin: mixinName,
          dynamic: true
        });
    });
  },

  returnEntity: function (name, entity) {
    var mixinName = this.groupName + name;
    var poolName = 'pool__' + mixinName;
    this.sceneEl.components[poolName].returnEntity(entity);
  },

  requestEntity: function (name) {
    var mixinName = this.groupName + name;
    var poolName = 'pool__' + mixinName;
    var entity = this.sceneEl.components[poolName].requestEntity();
    // entity.id= this.groupName + Math.floor(Math.random() * 1000);
    return entity;
  }
};

module.exports = PoolHelper;
},{"./utils":12}],12:[function(require,module,exports){
/* globals AFRAME */
function createMixin (id, obj, scene) {
  var mixinEl = document.createElement('a-mixin');
  mixinEl.setAttribute('id', id);
  Object.keys(obj).forEach(function (componentName) {
    var value = obj[componentName];
    if (typeof value === 'object') {
      value = AFRAME.utils.styleParser.stringify(value);
    }
    mixinEl.setAttribute(componentName, value);
  });

  var assetsEl = scene ? scene.querySelector('a-assets') : document.querySelector('a-assets');
  if (!assetsEl) {
    assetsEl = document.createElement('a-assets');
    scene.appendChild(assetsEl);
  }
  assetsEl.appendChild(mixinEl);

  return mixinEl;
}

Number.prototype.padLeft = function (n,str) {
  return Array(n-String(this).length+1).join(str||'0')+this;
}

String.prototype.pad = function (n,left, str) {
  var string = String(this).substr(0,n);
  var empty = Array(n-string.length+1).join(str||' ');
  return left ? empty + this : this + empty;
}

module.exports = {
  createMixin: createMixin
};
},{}],13:[function(require,module,exports){
/* global AFRAME ABLAST */
var PoolHelper = require('../lib/poolhelper.js');

ABLAST.BULLETS = {};

ABLAST.registerBullet = function (name, data, definition) {
  if (ABLAST.BULLETS[name]) {
    throw new Error('The bullet `' + name + '` has been already registered. ' +
                    'Check that you are not loading two versions of the same bullet ' +
                    'or two different bullets of the same name.');
  }

  ABLAST.BULLETS[name] = {
    poolSize: data.poolSize,
    components: data.components,
    definition: definition
  };

  console.info('Bullet registered ', name);
};

AFRAME.registerSystem('bullet', {
  init: function () {
    var self = this;
    this.poolHelper = new PoolHelper('bullet', ABLAST.BULLETS, this.sceneEl);
    this.activeBullets = [];

    /*this.sceneEl.addEventListener('gamestate-changed', function (evt) {
      if ('state' in evt.detail.diff) {
        if (evt.detail.state.state === 'STATE_GAME_OVER' || evt.detail.state.state === 'STATE_GAME_WIN') {
          self.reset();
        }
      }
    });*/
  },

  reset: function (entity) {
    var self = this;
    this.activeBullets.forEach(function (bullet) {
      self.returnBullet(bullet.getAttribute('bullet').name, bullet);
    });
  },

  returnBullet: function (name, entity) {
    this.activeBullets.splice(this.activeBullets.indexOf(entity), 1);
    this.poolHelper.returnEntity(name, entity);
  },

  getBullet: function (name) {
    var self = this;
    var bullet = this.poolHelper.requestEntity(name);
    this.activeBullets.push(bullet);
    return bullet;
  }
});
},{"../lib/poolhelper.js":11}]},{},[10]);
