/*
 * Olivia Chat Widget
 *
 * This script injects a floating chat button and iframe into any
 * webpage.  When the button is clicked, the iframe toggles
 * visibility.  The iframe loads the chat widget page hosted on
 * the same origin ("/widget").  The script determines the
 * correct host from its own script URL, making it suitable for
 * deployment on Vercel or other hosting platforms without
 * modification.  To use, include the following script tag on
 * your website (replace the src URL with your deployment URL):
 *
 *   <script src="https://YOUR_DOMAIN/widget.js" async></script>
 */
(function () {
  // Ensure the script runs in a browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  // Determine the base URL where this script is hosted.  This
  // assumes the script is served from /widget.js on your domain.
  var currentScript = document.currentScript || (function() {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();
  var scriptSrc = currentScript && currentScript.src ? currentScript.src : '';
  var host;
  try {
    host = new URL(scriptSrc).origin;
  } catch (e) {
    host = window.location.origin;
  }
  // Create the chat button
  var chatBtn = document.createElement('div');
  chatBtn.id = 'olivia-chat-bubble';
  chatBtn.style.position = 'fixed';
  chatBtn.style.bottom = '20px';
  chatBtn.style.right = '20px';
  chatBtn.style.width = '50px';
  chatBtn.style.height = '50px';
  chatBtn.style.borderRadius = '50%';
  chatBtn.style.background = '#fb923c';
  chatBtn.style.display = 'flex';
  chatBtn.style.alignItems = 'center';
  chatBtn.style.justifyContent = 'center';
  chatBtn.style.color = '#fff';
  chatBtn.style.fontSize = '24px';
  chatBtn.style.cursor = 'pointer';
  chatBtn.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
  chatBtn.innerHTML = '💬';
  // Create the iframe that will host the chat
  var frame = document.createElement('iframe');
  frame.id = 'olivia-chat-frame';
  frame.src = host + '/widget';
  frame.style.position = 'fixed';
  frame.style.bottom = '80px';
  frame.style.right = '20px';
  frame.style.width = '350px';
  frame.style.height = '500px';
  frame.style.border = 'none';
  frame.style.borderRadius = '12px';
  frame.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
  frame.style.display = 'none';
  frame.style.zIndex = '9999';
  // Toggle the iframe visibility when the button is clicked
  chatBtn.addEventListener('click', function () {
    if (frame.style.display === 'none') {
      frame.style.display = 'block';
    } else {
      frame.style.display = 'none';
    }
  });
  // Append the elements to the document
  document.body.appendChild(chatBtn);
  document.body.appendChild(frame);
})();