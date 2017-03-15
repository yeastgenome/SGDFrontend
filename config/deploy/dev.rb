set :stage, :dev

server ENV['DEV_SERVER'], user: fetch(:user), port: 22, roles: %w{app}
