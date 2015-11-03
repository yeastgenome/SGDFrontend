set :stage, :dev

server ENV['SERVER'], user: fetch(:user), port: 22, roles: %w{app}
