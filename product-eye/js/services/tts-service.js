export function speak(text, options = {}) {
  stop();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN';
  utterance.rate = options.rate ?? window.__settings?.voiceRate ?? 0.9;
  utterance.pitch = options.pitch ?? window.__settings?.voicePitch ?? 1.0;
  utterance.volume = options.volume ?? window.__settings?.voiceVolume ?? 1.0;
  speechSynthesis.speak(utterance);
  return utterance;
}

export function speakProduct(name, price) {
  speak(`${name}，价格：${Number(price).toFixed(2)}元`);
}

export function stop() {
  speechSynthesis.cancel();
}
