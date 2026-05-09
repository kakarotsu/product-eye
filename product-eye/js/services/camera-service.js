export async function start(videoEl, facingMode = 'environment') {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: false
  });
  videoEl.srcObject = stream;
  await videoEl.play();
  return stream;
}

export function stop(stream) {
  if (!stream) return;
  stream.getTracks().forEach((t) => t.stop());
}
