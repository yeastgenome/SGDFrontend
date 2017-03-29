/*eslint-disable no-undef */
export default function getPusherClient() {
  // depend on global Pusher, and window var pusher 
  return new Pusher(window.PUSHER_KEY, {
    encrypted: true
  });
}
