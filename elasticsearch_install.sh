java -version

# Download elasticsearch and add signing key

wget -qO - https://packages.elastic.co/GPG-KEY-elasticsearch | sudo apt-key add -

echo "deb https://packages.elastic.co/elasticsearch/2.x/debian stable main" | sudo tee -a /etc/apt/sources.list.d/elasticsearch-2.x.list

# Install elasticsearch
sudo apt-get update && sudo apt-get install elasticsearch -y

# Start elasticsearch
sudo service elasticsearch start

# wait
sleep 10

curl http://localhost:9200
