import React, { Component } from 'react';
import Promise from 'promise';
import {
  WebGLRenderer, Scene, PerspectiveCamera, Raycaster, Vector2, Vector3,
  PlaneBufferGeometry, Fog, Mesh, MeshBasicMaterial, Texture
} from 'three';

var v3 = new Vector3();

class CoverFlow extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.drag = 0.0625;
    this.BrowserHeight = 20;
  }
  shouldComponentUpdate() {
    return false;
  }
  componentDidMount() {

    this._loop = this.loop.bind(this);

    var renderer = this.renderer = new WebGLRenderer({ antialis: true });
    var scene = this.scene = new Scene();
    var camera = this.camera = new PerspectiveCamera(75);
    camera.userData.position = new Vector3();

    this.raycaster = new Raycaster();
    this.geometry = new PlaneBufferGeometry(1, 1);
    this.mouse = new Vector2();

    this.width = 8.5;
    this.height = 11;
    this.distance = 10;
    // this.canvas.width = this.canvas.height = 1024;

    this.container.appendChild(this.renderer.domElement);
    this.initiated = true;

    var range = this.range = {
      min: Infinity,
      max: - Infinity
    };

    scene.fog = new Fog('black', 0, 50);

    camera.userData.position.y = 8;
    camera.rotation.x = - Math.PI / 5;

    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.top = 0;
    renderer.domElement.style.left = 0;

    window.addEventListener('resize', this.resize.bind(this), false);

    window.addEventListener('mousewheel', function(e) {

      e.preventDefault();
      var y = e.deltaY;

      camera.userData.position.z += y / 10;
      camera.userData.position.z = Math.max(
        Math.min(camera.userData.position.z, range.max), range.min);

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

      camera.userData.position.z -= deltaY / 10;
      camera.userData.position.z = Math.max(
        Math.min(camera.userData.position.z, range.max), range.min);

      touch.x = t.clientX;
      touch.y = t.clientY;

    }, false);

    renderer.domElement.addEventListener('click', this.click.bind(this), false);

    this.resize();
    this.loop();

  }
  createPaper(i, data) {

    var scope = this;
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');

    canvas.width = canvas.height = 1024;

    var image = document.createElement('img');
    image.crossOrigin = 'anonymous';

    var mesh = new Mesh(
      this.geometry, new MeshBasicMaterial({
        color: '#efefef',
        transparent: true,
        opacity: 0
      })
    );
    mesh.userData.position = new Vector3();
    mesh.userData.opacity = 0;
    mesh.userData.promise = new Promise(function(resolve, reject) {

      image.onload = function(e) {

        var sx = 0;
        var sy = 0;
        var sw = image.width;
        var sh = image.width * scope.height / scope.width;

        var dx = 0;
        var dy = scope.BrowserHeight;
        var dw = canvas.width;
        var dh = canvas.height;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);

        scope.drawBrowserBar(canvas, ctx, data);

        mesh.material.color.set('white');
        mesh.material.map = new Texture(canvas);
        mesh.material.map.anisotropy = scope.renderer.getMaxAnisotropy();

        mesh.material.map.needsUpdate = true;
        mesh.material.needsUpdate = true;
        resolve(e);

      };
      image.onerror = reject;
      image.src = data.screenshot_url;

    });

    mesh.position.z = mesh.userData.position.z = - this.distance * i;
    mesh.position.y = mesh.userData.position.y = - this.camera.position.y;
    mesh.rotation.x = - Math.PI / 10;
    mesh.scale.x = this.width;
    mesh.scale.y = this.height;
    mesh.userData.model = data;

    return mesh;

  }
  drawBrowserBar(canvas, ctx, data) {

    var w = canvas.width;
    var h = this.BrowserHeight;
    var r = h / 4;
    var fontSize = h * 0.85;

    ctx.fillStyle = '#ccc';
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, h / 2);
    ctx.quadraticCurveTo(0, 0, h / 2, 0);
    ctx.lineTo(w - h / 2, 0);
    ctx.quadraticCurveTo(w, 0, w, h / 2);
    ctx.lineTo(w, h);
    ctx.closePath();

    ctx.fill();

    ctx.fillStyle = '#efefef';

    ctx.beginPath();
    for (var i = 0; i < 3; i++) {
      var x = h * (i + 1);
      var y = h / 2;
      ctx.moveTo(x, y);
      ctx.arc(x, y, r, 0, Math.PI * 2);
    }
    ctx.fill();

    ctx.fillStyle = '#333';
    ctx.font = '900 ' + fontSize + 'px/' + fontSize + 'px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(data.timestamp.slice(0, 4).split('').join(' '), w / 2, h / 2);

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
      window.open(mesh.userData.model.url, '_blank');
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

    this.camera.position.add(
      v3.copy(this.camera.userData.position)
        .sub(this.camera.position)
        .multiplyScalar(this.drag)
    );

    for (var i = 0; i < this.scene.children.length; i++) {
      var mesh = this.scene.children[i];
      if (mesh.userData.position !== undefined) {
        mesh.position.add(
          v3.copy(mesh.userData.position)
            .sub(mesh.position)
            .multiplyScalar(this.drag * 2)
        );
      }
      if (mesh.userData.opacity !== undefined) {
        mesh.material.opacity += (mesh.userData.opacity
          - mesh.material.opacity) * this.drag * 2;
      }
    }

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this._loop);

  }
  componentWillUnmount() {

  }
  componentWillReceiveProps(nextProps) {

    var scope = this;
    var props = nextProps;

    if (this.initiated) {

      // Only necessary if not refreshing the page on new query.
      // if (this.scene.children.length > 0) {
      //   let children = this.scene.children.slice(0);
      //   for (var i = 0; i < children.length; i++) {
      //     var mesh = children[i];
      //     mesh.dispose();
      //     this.scene.remove(mesh);
      //   }
      // }

      for (var j = 0; j < props.data.length; j++) {

        let mesh = this.createPaper(j, props.data[j]);

        this.range.min = Math.min(this.range.min, mesh.position.z);
        this.range.max = Math.max(this.range.max, mesh.position.z);

        mesh.userData.promise.then(function() {
          mesh.userData.position.y = 0;
          mesh.userData.opacity = 1;
          scope.scene.add(mesh);
        });

      }

      if (props.data.length > 0) {
        this.range.min += this.distance * 0.66;
        this.range.max += this.distance * 0.66;
        this.camera.userData.position.z = this.range.max;
      }

    }

  }
  render() {

    return (
      <div className="CoverFlow" ref={el => this.container = el}></div>
    );
  }
}

export default CoverFlow;
