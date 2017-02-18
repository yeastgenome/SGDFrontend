set :stage, :dev

server ENV['CURATE_DEV_SERVER'], user: fetch(:user), port: 22, roles: %w{app}
