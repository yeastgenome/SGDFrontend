set :stage, :dev

server ENV['PROD_SERVER_A'], user: fetch(:user), port: 22, roles: %w{app}
server ENV['PROD_SERVER_B'], user: fetch(:user), port: 22, roles: %w{app}
