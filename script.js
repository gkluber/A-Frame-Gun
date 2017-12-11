var sceneEl = document.querySelector('a-scene');
AFRAME.registerComponent('do-something-once-loaded', {
  init: function () {
    // This will be called after the entity has properly attached and loaded.
    console.log('I am ready!');
  }
});
var entityEl = document.createElement('a-entity');
entityEl.setAttribute('do-something-once-loaded', '');
sceneEl.appendChild(entityEl);