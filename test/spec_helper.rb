require 'coveralls'
Coveralls.wear!

if ENV["COVERAGE"]
  require "simplecov"
  SimpleCov.start do
    # Don't measure coverage of the tests themselves.
    add_filter "/test/"
  end

  # track all ruby files under src
  src_location = File.expand_path("../../src", __FILE__)
  SimpleCov.track_files("#{src_location}/**/*.rb")

  # use coveralls for on-line code coverage reporting at Travis CI
  if ENV["TRAVIS"]
    require "coveralls"
    SimpleCov.formatter = SimpleCov::Formatter::MultiFormatter[
      SimpleCov::Formatter::HTMLFormatter,
      Coveralls::SimpleCov::Formatter
    ]
  end
end
