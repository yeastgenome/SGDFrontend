lock '3.4.0'

set :application, 'SGDFrontend'

set :repo_url, 'git://github.com/yeastgenome/SGDFrontend.git'
set :branch, ENV['BRANCH'] || $1 if `git branch` =~ /\* (\S+)\s/m
set :deploy_to, '/data/www/' + fetch(:application) + '_app'

set :user, ask('Username', nil)
set :tmp_dir, "/home/#{fetch(:user)}/tmp"

set :default_stage, "dev"

set :keep_releases, 5
set :format, :pretty
set :log_level, :debug

namespace :deploy do
  after :finishing, :write_config
  after :finishing, :build
  if ENV['BUILD_STATICS']
  	after :finishing, :build_statics
  end
  after :finishing, :upload_statics
  after :finishing, :verify_symlink
  after :finishing, :restart
end
