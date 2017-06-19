set :stage, :prod2

server ENV['AWS_SERVER'], user: fetch(:user), port: 22, roles: %w{app}
