namespace :deploy do
  desc 'Build application'
  task :build do
    on roles(:app), in: :sequence do
      execute "workon sgd && pip install -r requirements.txt"
    end
  end

  desc 'Restart WSGI'
  task :restart do
    on roles(:app), in: :sequence do
      execute "ENV=prod python #{current_path}/src/app.py &"
    end
  end

  desc 'Write config file'
  task :write_config do
    on roles(:app), in: :sequence do
      execute "echo \"#{generate_config_content}\" >> #{current_path}/src/config/config.py"
    end
  end

  desc 'Write local config file'
  task :local_write_config do
    exec "echo \"#{generate_config_content}\" >> ./config/config.py"
  end

  def generate_config_content
    config_file_content = ""
    ["NEX2_URI"].each do |key|
      config_file_content += "#{key} = \'#{ENV[key]}\'\n"
    end
    config_file_content += "SQLALCHEMY_TRACK_MODIFICATIONS = False\n"
    return config_file_content
  end
end
