$image_name = "lavanetworkdemo"
$tag_name = "latest"

# Build Docker image
docker build -t $image_name:$tag_name .

# Run Docker container
docker run -p 8080:80 $image_name:$tag_name
