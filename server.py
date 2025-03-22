from http.server import HTTPServer, SimpleHTTPRequestHandler
import socketserver

PORT = 3000

Handler = SimpleHTTPRequestHandler
Handler.extensions_map.update({
    '.js': 'application/javascript',
})

httpd = socketserver.TCPServer(("", PORT), Handler)
print(f"Serving at port {PORT}")
httpd.serve_forever()
