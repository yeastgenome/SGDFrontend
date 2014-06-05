import os

from setuptools import setup, find_packages

here = os.path.abspath(os.path.dirname(__file__))
README = open(os.path.join(here, 'README.txt')).read()
CHANGES = open(os.path.join(here, 'CHANGES.txt')).read()

requires = [
    'markupsafe<0.16',
    'pyramid==1.5',
    'pyramid_jinja2==2.1',
    'waitress==0.8.9',
    'simplejson==3.5.2',
    'requests==2.3.0'
    ]

tests_require = [
    'behave',
    'behaving',
    'pytest',
    'selenium'
]

setup(name='SGDFrontend',
      version='0.0',
      description='SGDFrontend',
      long_description=README + '\n\n' + CHANGES,
      classifiers=[
        "Programming Language :: Python",
        "Framework :: Pyramid",
        "Topic :: Internet :: WWW/HTTP",
        "Topic :: Internet :: WWW/HTTP :: WSGI :: Application",
        ],
      author='Kelley Paskov',
      author_email='kpaskov@stanford.edu',
      url='',
      keywords='web pyramid pylons',
      packages=find_packages(),
      include_package_data=True,
      zip_safe=False,
      install_requires=requires,
      tests_require=requires,
      test_suite="yeastgenome",
      extras_require={
        'test': tests_require,
      },
      entry_points="""\
      [paste.app_factory]
      yeastgenome = src:yeastgenome
      """,
      )
