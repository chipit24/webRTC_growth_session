const webSocketConnection = new WebSocket('ws://localhost:3000');
const peerConnection = new RTCPeerConnection();

console.log('opening websocket connection');

webSocketConnection.addEventListener('error', () => {
  console.log('error');
});

webSocketConnection.addEventListener('open', () => {
  console.log('websocket connection open');
});

webSocketConnection.addEventListener('message', async messageEvent => {
  const {
    text, offer, answer, iceCandidate,
  } = JSON.parse(messageEvent.data);

  if (text) {
    console.log(text);
  }

  if (offer) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answerToOffer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(new RTCSessionDescription(answerToOffer));
    webSocketConnection.send(JSON.stringify({ answer: answerToOffer }));
    console.log('Recieved offer, sendinig answer, setting peerConnection.setLocalDescription');
  }

  if (answer) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    console.log('Recieved answer, setting peerConnection.setRemoteDescription');
  }

  if (iceCandidate) {
    try {
      await peerConnection.addIceCandidate(iceCandidate);
    } catch (error) {
      console.error('Error adding received ice candidate', error);
    }
  }
});

async function streamLocalVideo() {
  let stream = null;

  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    stream
      .getTracks()
      .forEach(track => peerConnection.addTrack(track, stream));
    document.getElementById('local-video').srcObject = stream;

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(new RTCSessionDescription(offer));

    webSocketConnection.send(JSON.stringify({ offer }));
    console.log('Sent offer, setting peerConnection.setLocalDescription');
  } catch (error) {
    console.warn(error.message);
  }
}

streamLocalVideo();

// peerConnection.ontrack = function onTrack({ streams: [stream] }) {
//   const remoteVideo = document.getElementById('remote-video');
//   remoteVideo.srcObject = stream;
// };

const remoteStream = new MediaStream();
const remoteVideo = document.getElementById('remote-video');
remoteVideo.srcObject = remoteStream;

peerConnection.addEventListener('track', async event => {
  remoteStream.addTrack(event.track, remoteStream);
});

peerConnection.addEventListener('icecandidate', event => {
  console.log('icecandidate', event.candidate);
  if (event.candidate) {
    webSocketConnection.send(JSON.stringify({ iceCandidate: event.candidate }));
  }
});

peerConnection.addEventListener('connectionstatechange', () => {
  if (peerConnection.connectionState === 'connected') {
    console.log('peer connected!');
  }
});
