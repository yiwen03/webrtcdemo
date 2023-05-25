const message = {
  el: document.querySelector(".logger"),
  log(msg) {
    this.el.innerHTML += `<span>${new Date().toLocaleTimeString()}：${msg}</span><br/>`;
  },
  error(msg) {
    this.el.innerHTML += `<span class="error">${new Date().toLocaleTimeString()}：${msg}</span><br/>`;
  },
};

function receivemsg(e) {
  var msg = e.data;
  if (msg) {
    message.log("-> " + msg + "\r\n");
  } else {
    console.error("received msg is null");
  }
}

function dataChannelStateChange() {
  var readyState = dc.readyState;
  if (readyState === "open") {
    send_txt.disabled = false;
    // send.disabled = false;
  } else {
    send_txt.disabled = true;
    // send.disabled = true;
  }
}
