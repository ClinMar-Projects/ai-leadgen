/*
 * Olivia Chat Widget (auto-open version)
 *
 * This script injects a floating chat bubble and an iframe into any
 * webpage.  The chat window opens automatically on page load while
 * keeping the bubble visible, so visitors can minimise or reopen it.
 * The bubble and primary buttons use a purple→blue gradient to
 * match the site's design.
 *
 * To use the widget, serve this file at /widget.js and include:
 *
 *   <script src="https://YOUR_DOMAIN/widget.js" async></script>
 *
 * The script determines its origin from the script tag and uses
 * that as the base URL to load the /widget page.
 */
(function () {
  // Only run in a browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  // Determine the base origin where this script is served
  var currentScript = document.currentScript || (function() {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();
  var scriptSrc = currentScript && currentScript.src ? currentScript.src : '';
  var origin;
  try {
    origin = new URL(scriptSrc).origin;
  } catch (e) {
    origin = window.location.origin;
  }
  // Create a gradient chat bubble button
  var bubble = document.createElement('button');
  bubble.id = 'olivia-chat-bubble';
  bubble.setAttribute('type', 'button');
  bubble.setAttribute('aria-label', 'Toggle chat');
  Object.assign(bubble.style, {
    position: 'fixed',
    right: '20px',
    bottom: '20px',
    width: '56px',
    height: '56px',
    borderRadius: '9999px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    padding: '0',
    cursor: 'pointer',
    color: '#ffffff',
    fontSize: '24px',
    backgroundImage: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
    zIndex: '2147483000',
  });
  bubble.innerHTML = '💬';
  // Lighten the bubble on hover
  bubble.addEventListener('mouseenter', function () {
    bubble.style.filter = 'brightness(1.08)';
  });
  bubble.addEventListener('mouseleave', function () {
    bubble.style.filter = 'none';
  });
  // Create a wrapper for the iframe to control visibility and sizing
  var wrap = document.createElement('div');
  wrap.id = 'olivia-chat-wrapper';
  Object.assign(wrap.style, {
    position: 'fixed',
    right: '20px',
    bottom: '90px',
    width: '380px',
    height: '560px',
    maxWidth: '95vw',
    maxHeight: '80vh',
    borderRadius: '16px',
    overflow: 'hidden',
    background: '#ffffff',
    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)',
    zIndex: '2147483000',
  });
  // Create the iframe itself
  var iframe = document.createElement('iframe');
  iframe.id = 'olivia-chat-frame';
  iframe.src = origin + '/widget';
  Object.assign(iframe.style, {
    border: 'none',
    width: '100%',
    height: '100%',
  });
  wrap.appendChild(iframe);
  // Initially open the chat window
  var open = true;
  wrap.style.display = open ? 'block' : 'none';
  // Toggle wrapper visibility when bubble is clicked
  bubble.addEventListener('click', function () {
    open = !open;
    wrap.style.display = open ? 'block' : 'none';
  });
  // Append elements to the document body
  document.body.appendChild(bubble);
  document.body.appendChild(wrap);
})();