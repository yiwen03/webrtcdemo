"use strict";

var pcConfig = {
  iceServers: [
    { url: "stun:stun.l.google.com:19302" }
  ],
};

var iceGatheringState;

function sendMessage(roomid, data) {
  console.log("send message to other end", roomid, data);
  if (!socket) {
    console.log("socket is null");
  }
  socket.emit("message", roomid, data);
}

function createPeerConnection() {
  message.log("创建 RTCPeerConnection");
  if(!pc){
    pc = new RTCPeerConnection(pcConfig);

		pc.ontrack = (e) => {
      if (e && e.streams) {
        message.log("收到对方音频/视频流数据...");
        remoteVideo.srcObject = e.streams[0];
      }
    };

    pc.oniceconnectionstatechange = (ev) => {
      let connection = ev.target;
      iceGatheringState = connection.iceGatheringState
      console.log('iceGatheringState:', iceGatheringState);
      // message.log("ice 连接状态变化", iceGatheringState);
    };

    pc.onicecandidate = (event) => {
      if (!event.candidate) return;
      sendMessage(roomid, {
        type: "candidate",
        label: event.candidate.sdpMLineIndex,
        id: event.candidate.sdpMid,
        candidate: event.candidate.candidate,
      });
    };
    pc.ondatachannel = e => {
      if(!dc){
        dc = e.channel;
        dc.onmessage = receivemsg;
        dc.onopen = dataChannelStateChange;
        dc.opclose = dataChannelStateChange;
      }
    }; //当对接创建数据通道时会回调该方法。
  }else{
    console.log('this is the end candidate')
  }
}
