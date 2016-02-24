set :stage, :dev

server ENV['STAGING_SERVER'], user: fetch(:user), port: 22, roles: %w{app}
