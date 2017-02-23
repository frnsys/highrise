function get(href) {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open('GET', href, false);
  xmlhttp.send();
  return xmlhttp.responseText;
}

function route(routes) {
  var path = window.location.pathname + window.location.search;
  if (!(path in routes)) {
    path = '*';
  }
  if (routes[path].html) {
    var html = get(routes[path].html);
    document.getElementById('root').innerHTML = html;
  }
  routes[path].func();
}

export default route;
