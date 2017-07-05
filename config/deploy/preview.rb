set :stage, :dev

server ENV['PREVIEW_SERVER'], user: fetch(:user), port: 22, roles: %w{app}
