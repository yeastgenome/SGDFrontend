set :stage, :prod1

server ENV['SERVER_1'], user: fetch(:user), port: 22, roles: %w{app}
