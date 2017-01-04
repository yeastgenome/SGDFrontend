lock '3.4.0'

set :application, 'SGDFrontend'

set :ssh_options, {:forward_agent => true}

set :repo_url, 'git://github.com/yeastgenome/SGDFrontend.git'
set :branch, ENV['BRANCH'] || $1 if `git branch` =~ /\* (\S+)\s/m
set :deploy_to, '/data/www/' + fetch(:application)# + '_app'

set :user, ask(:user, nil)
# set :tmp_dir, "/var/tmp"
set :tmp_dir, "/tmp"


set :default_stage, "dev"

set :keep_releases, 5
set :format, :pretty
set :log_level, :debug

namespace :deploy do
  after :finishing, :write_config
  after :finishing, :build
  # after :finishing, :verify_symlink
  after :finishing, :restart
end
