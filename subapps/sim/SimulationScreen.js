import * as THREE from 'three';

class SimulationScreen {
	constructor() {
		this.video = '';
		this.videoTexture = '';
	}


	initWebcam() {
		navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
		window.URL = window.URL || window.webkitURL;

    // TODO try to do this instead
		var camvideo = document.getElementById('camvideo');

		if (!navigator.getUserMedia)	{
				document.getElementById('errorMessage').innerHTML = 
						'Sorry. <code>navigator.getUserMedia()</code> is not available.';
		} else {
				navigator.getUserMedia({video: true}, gotStream, noStream);
		}

		function gotStream(stream) 	{
				if (window.URL) {
					camvideo.src = window.URL.createObjectURL(stream);
				} else { // Opera
					camvideo.src = stream;
				}
				camvideo.onerror = function(e) {
					stream.stop();
				};
				stream.onended = noStream;
		}

		function noStream(e) {
				var msg = 'No camera available.';
				if (e.code == 1) {
					msg = 'User denied access to use camera.';
				}
				document.getElementById('errorMessage').textContent = msg;
		}

	}

	initScreen(scene) {
		console.log(scene);
		this.video = document.getElementById( 'camvideo' );

		this.videoTexture = new THREE.Texture( this.video );
		this.videoTexture.minFilter = THREE.LinearFilter;

		var movieMaterial = new THREE.MeshBasicMaterial( { map: this.videoTexture, overdraw: true, side:THREE.DoubleSide } );
		// the geometry on which the movie will be displayed;
		//         movie image will be scaled to fit these dimensions.
		var movieGeometry = new THREE.PlaneGeometry( 7, 5, 1, 1 );
		var movieScreen = new THREE.Mesh( movieGeometry, movieMaterial );
		movieScreen.position.set(10,2.5,1);
		scene.add(movieScreen);

	}

	update() {

		if( this.video.readyState === this.video.HAVE_ENOUGH_DATA ){
			this.videoTexture.needsUpdate = true;
		}
	}


}

export default SimulationScreen;

/*
SimulationScreen.initVideo
SimulationScreen.initScreen
*/
