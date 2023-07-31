$image_name = "lavanetworkdemo"


# Build Docker image
docker build -t "$($image_name)" .

# Run Docker container
docker run -p 8080:80 "$($image_name)"
