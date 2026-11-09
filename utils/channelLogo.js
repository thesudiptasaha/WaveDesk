export function channelLogoSrc(channelName) {
  if (typeof channelName === 'string' && /wave/i.test(channelName)) {
    return '/logos/the-wave.svg';
  }
  return null;
}

