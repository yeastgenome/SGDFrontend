namespace :deploy do
  desc 'Build application'
  task :build do
    on roles(:app), in: :sequence do
      execute "export WORKON_HOME=~/envs/ && source virtualenvwrapper.sh && cd #{current_path} && workon sgd && pip install -r requirements.txt"
    end
  end

  desc 'Write config variables'
  task :config do
    on roles(:app), in: :sequence do
      variables = "'"
      ["NEX2_URI", "S3_ACCESS_KEY", "S3_SECRET_KEY", "S3_BUCKET", "GOOGLE_CLIENT_ID"].each do |k|
        variables += "export #{k}=\"#{ENV[k]}\"\n"
      end
      variables += "'"
      execute "echo #{variables} > #{current_path}/prod_variables.sh"
    end
  end

  desc 'Start pyramid'
  task :restart do
    on roles(:app), in: :sequence do
      execute "cd #{current_path} && source prod_variables.sh && make restart-prod"
    end
  end
end
