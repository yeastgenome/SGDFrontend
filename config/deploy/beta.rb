set :stage, :dev

server ENV['BETA_SERVER'], user: fetch(:user), port: 22, roles: %w{app}
