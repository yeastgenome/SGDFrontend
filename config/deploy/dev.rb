set :stage, :dev

server ENV['SERVER'], user: fetch(:user), port: 22, roles: %w{app}

namespace :deploy do
  after "deploy:build_statics", :upload_statics
end
