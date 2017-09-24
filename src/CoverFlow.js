import React, { Component } from 'react';
import {
  WebGLRenderer, Scene, PerspectiveCamera, Raycaster, Vector2,
  PlaneBufferGeometry, Fog, Mesh, MeshBasicMaterial, Texture
} from 'three';

class CoverFlow extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }
  componentDidMount() {

    this.canvas = document.createElement('canvas');
    this._loop = this.loop.bind(this);

    var renderer = this.renderer = new WebGLRenderer({ antialis: true });
    var scene = this.scene = new Scene();
    var camera = this.camera = new PerspectiveCamera(75);

    this.raycaster = new Raycaster();
    this.geometry = new PlaneBufferGeometry(1, 1);
    this.mouse = new Vector2();

    this.width = 8.5;
    this.height = 11;
    this.distance = 10;
    this.canvas.width = this.canvas.height = 1024;

    this.container.appendChild(this.renderer.domElement);
    this.initiated = true;

    var range = this.range = {
      min: Infinity,
      max: - Infinity
    };

    scene.fog = new Fog('black', 0, 50);

    camera.position.y = 8;
    camera.rotation.x = - Math.PI / 5;

    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.top = 0;
    renderer.domElement.style.left = 0;

    window.addEventListener('resize', this.resize.bind(this), false);

    window.addEventListener('mousewheel', function(e) {

      e.preventDefault();
      var y = e.deltaY;

      camera.position.z += y / 10;
      camera.position.z = Math.max(
        Math.min(camera.position.z, range.max), range.min);

    });

    var touch = new Vector2();

    renderer.domElement.addEventListener('touchstart', function(e) {
      var t = e.touches[0];
      touch.x = t.clientX;
      touch.y = t.clientY;
    }, false);

    renderer.domElement.addEventListener('touchmove', function(e) {

      var t = e.touches[0];
      var deltaY = t.clientY - touch.y;

      camera.position.z -= deltaY / 10;
      camera.position.z = Math.max(
        Math.min(camera.position.z, range.max), range.min);

      touch.x = t.clientX;
      touch.y = t.clientY;

    }, false);

    renderer.domElement.addEventListener('click', this.click.bind(this), false);

    this.resize();
    this.loop();

  }
  createPaper(i, data) {

    var scope = this;
    var canvas = this.canvas;

    var mesh = new Mesh(
      this.geometry, new MeshBasicMaterial({
        color: 'white',
        map: new Texture()
      })
    );

    var image = document.createElement('img');
    image.crossOrigin = 'anonymous';
    image.onload = function() {

      var sx = 0;
      var sy = 0;
      var sw = image.width;
      var sh = image.width * scope.height / scope.width;

      var dx = 0;
      var dy = 0;
      var dw = canvas.width;
      var dh = canvas.height;

      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
      canvas.getContext('2d').drawImage(
        image, sx, sy, sw, sh, dx, dy, dw, dh);

      mesh.material.map.image = canvas;
      mesh.material.map.needsUpdate = true;

    };
    image.src = /*'./images/iskme-org.png';//*/data.screenshot_url;

    mesh.position.z = - this.distance * i;
    mesh.rotation.x = - Math.PI / 10;
    mesh.scale.x = this.width;
    mesh.scale.y = this.height;
    mesh.userData.model = data;

    return mesh;

  }
  click(e) {

    e.preventDefault();

    this.mouse.x = ( e.clientX / window.innerWidth ) * 2 - 1;
    this.mouse.y = - ( e.clientY / window.innerHeight ) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    var intersects = this.raycaster.intersectObjects(this.scene.children);
    var mesh;

    if (intersects.length > 0) {
      mesh = intersects[0].object;
      // TODO: Use mesh.userData and the real data to
      // pop open the right URL
      window.open(mesh.userData.model.screenshot_url, '_blank');
    }

  }
  resize() {

    var w = window.innerWidth;
    var h = window.innerHeight;

    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();

  }
  loop() {

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this._loop);

  }
  componentWillUnmount() {

  }
  componentWillReceiveProps(nextProps) {
    var props = nextProps;

    if (this.initiated) {

      if (this.scene.children.length > 0) {
        var children = this.scene.children.slice(0);
        for (var i = 0; i < children.length; i++) {
          this.scene.remove(children[i]);
          // TODO: Dispose of memory stuff on each mesh here...
          // children[i].dispose();
        }
      }

      for (var j = 0; j < props.data.length; j++) {

        var mesh = this.createPaper(j, props.data[j]);

        this.range.min = Math.min(this.range.min, mesh.position.z);
        this.range.max = Math.max(this.range.max, mesh.position.z);

        this.scene.add(mesh);

      }

      this.range.min += this.distance * 0.66;
      this.range.max += this.distance * 0.66;

    }

  }
  render() {

    return (
      <div className="CoverFlow" ref={el => this.container = el}></div>
    );
  }
}

export default CoverFlow;
