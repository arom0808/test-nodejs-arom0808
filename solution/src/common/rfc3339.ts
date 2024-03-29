export function rfc3339(d: Date) {
  function pad(n: number) {
    return n < 10 ? '0' + n : n;
  }

  function timezoneOffset(offset: number) {
    let sign;
    if (offset === 0) {
      return 'Z';
    }
    sign = offset > 0 ? '-' : '+';
    offset = Math.abs(offset);
    return sign + pad(Math.floor(offset / 60)) + ':' + pad(offset % 60);
  }

  return (
    d.getFullYear() +
    '-' +
    pad(d.getMonth() + 1) +
    '-' +
    pad(d.getDate()) +
    'T' +
    pad(d.getHours()) +
    ':' +
    pad(d.getMinutes()) +
    ':' +
    pad(d.getSeconds()) +
    timezoneOffset(d.getTimezoneOffset())
  );
}
