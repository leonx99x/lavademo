$image_name = "lavanetworkdemo"

# Build Docker image
docker build -t $image_name .

# Run Docker container
docker run -p 3000:3000 $image_name