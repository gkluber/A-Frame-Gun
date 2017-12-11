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