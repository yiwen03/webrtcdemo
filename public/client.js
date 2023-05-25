"use strict";

const localVideo = document.querySelector("#local-video");
const remoteVideo = document.querySelector("#remote-video");
const button = document.querySelector("button.start-button");
const btnConn = document.querySelector("button#connserver");
const send_txt = document.querySelector("input#sendtxt");
// const startbutton = document.querySelector("button.sendtxt");
const btnLeave = document.querySelector("button#leave");
var btnSend = document.querySelector("button#send");
var tips = document.querySelector("div.tips");

var state = "init";

var socket = null;
var roomid;
var pc = null;
var dc = null;
var state = "init";
var offerdesc = null;


localVideo.onloadeddata = () => {
  message.log("播放本地视频");
  localVideo.play();
};
remoteVideo.onloadeddata = () => {
  message.log("播放对方视频");
  remoteVideo.play();
};

function handleOfferError(err) {
  console.error("Failed to create offer:", err);
}

async function call() {
  debugger
  if (state === "joined_conn") {
		const offer = await pc.createOffer()
    await pc.setLocalDescription(offer).catch(handleOfferError);
    message.log(`发起方发送 offer`);
    sendMessage(roomid, offer);
  }
}

function connSignalServer() {
  socket = io.connect();
  socket.on("connect", () => {
    message.log("信令通道创建成功！");
  });
  socket.on("joined", (roomid, id, userNumber) => {
    message.log(
      `receive joined message!roomid: ${roomid},id: ${id}`,
    );
    state = "joined";
    createPeerConnection();
    if (userNumber > 1) {
      tips.style.display = "none";
    }
  });

  socket.on("otherjoin", (roomid) => {
    message.log(`receive joined message!roomid: ${roomid}`);
		if (state === "joined_unbind") {
      createPeerConnection();
    }

    dc = pc.createDataChannel("chat");
    dc.onmessage = e => console.log('message', e);
    dc.onopen = dataChannelStateChange;
		dc.onclose = dataChannelStateChange;

		state = "joined_conn";
    tips.style.display = 'none';
    button.style.display = "block";
		message.log(`receive other_join message, state=${state}`);
  });

  socket.on("message", async (roomid, data) => {
    // message.log(`receive message!${roomid}`, JSON.stringify(data));
    if (data === null || data === undefined) {
      console.error("the message is invalid!");
      return;
    }
    if (data.hasOwnProperty("type") && data.type === "offer") {
      message.log("收到 offer in msg");
      //接收到发起方的offer  同时本地代理ICE开始通过信令服务器去传递信息给其他端 触发onicecandidate事件
      startLive(data);
    } else if (data.hasOwnProperty("type") && data.type === "answer") {
      const answer = new RTCSessionDescription(data);
      message.log("收到 answer，设置远端配置");
      pc.setRemoteDescription(answer);
    } else if (data.hasOwnProperty("type") && data.type === "candidate") {
      message.log("收到候选协商");
      var candidate = new RTCIceCandidate({
        sdpMLineIndex: data.label,
        candidate: data.candidate,
      });
      pc.addIceCandidate(candidate)
        .then(() => {
          console.log("Successed to add ice candidate");
        })
        .catch((err) => {
          console.error(err);
        });
    }
  });

	socket.on("full", (roomid, id) => {
    console.log("receive full message", roomid, id);
    socket.disconnect();
    hangup();
    state = "leaved";
    console.log("receive full message, state=", state);
    alert("the room is full!");
  });

  socket.on("leaved", (roomid, id) => {
    console.log("receive leaved message", roomid, id);
    state = "leaved";
    socket.disconnect();
    console.log("receive leaved message, state=", state);

    // btnConn.disabled = false;
    btnLeave.disabled = true;
  });

  socket.on("bye", (room, id) => {
    console.log("receive bye message", roomid, id);
    state = "joined_unbind";
    hangup();
    console.log("receive bye message, state=", state);
  });

  socket.on("disconnect", (socket) => {
    console.log("receive disconnect message!", roomid);
    if (!(state === "leaved")) {
      hangup();
    }
    state = "leaved";
    // btnConn.disabled = false;
    btnLeave.disabled = true;
  });

  roomid = "chat";
  socket.emit("join", roomid);
}

async function startLive(data) {
  button.style.display = "none";
  let stream;
  try {
    message.log("尝试调取本地摄像头/麦克风");

    stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    message.log("摄像头/麦克风获取成功！");
    localVideo.srcObject = stream;
  } catch {
    message.error("摄像头/麦克风获取失败！");
    return;
  }
  message.log("将媒体轨道添加到轨道集");
  stream.getTracks().forEach((track) => {
    pc.addTrack(track, stream); //将音视频流添加到 RTCPeerConnection 对象中
  });

  if (!data) {
    message.log("创建本地SDP");
    call();
  } else {
    message.log("设置远端配置");
    await pc.setRemoteDescription(new RTCSessionDescription(data));
    message.log("创建 Answer SDP");
    const answer = await pc.createAnswer();
    message.log(`传输 Answer SDP`);
    sendMessage(roomid, answer);
    await pc.setLocalDescription(answer);
  }
}

function hangup() {
  if (!pc) {
    return;
  }

  offerdesc = null;

  pc.close();
  pc = null;
}


function leave() {
  socket.emit("leave", roomid);

  hangup();

  // btnConn.disabled = false;
  btnLeave.disabled = true;
}

function sendText() {
  var data = send_txt.value;
  if(data){
    dc.send(data)
  }
  send_txt.value = '';
  message.log(`<- ${data} `);
}

button.addEventListener('click', () => startLive());
btnLeave.addEventListener("click", leave);
btnSend.addEventListener('click', sendText);

connSignalServer()
