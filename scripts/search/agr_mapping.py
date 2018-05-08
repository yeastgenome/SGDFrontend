mapping = {
        "settings": {
        "index": {
            "max_result_window": 15000,
            "analysis": {
                "analyzer": {
                    "default": {
                        "type": "custom",
                        "tokenizer": "whitespace",
                        "filter": ["english_stemmer", "lowercase"]
                    },
                    "autocomplete": {
                        "type": "custom",
                        "tokenizer": "whitespace",
                        "filter": ["lowercase", "autocomplete_filter"]
                    },
                    "symbols": {
                        "type": "custom",
                        "tokenizer": "whitespace",
                        "filter": ["lowercase"]
                    }
                },
                "filter": {
                    "english_stemmer": {
                        "type": "stemmer",
                        "language": "english"
                    },
                    "autocomplete_filter": {
                        "type": "edge_ngram",
                        "min_gram": "1",
                        "max_gram": "20"
                    }
                }
            },
            "number_of_replicas": "1", #temporarily
            "number_of_shards": "5"
        }
    },
    "mappings": { # having a raw field means it can be a facet or sorted by
        "searchable_item": {
            "properties": {
                "name": {
                    "type": "string",
                    "fields": {
                        "symbol": {
                            "type": "string",
                            "analyzer": "symbols"
                        },
                        "raw": {
                            "type": "string",
                            "index": "not_analyzed"
                        },
                        "autocomplete": {
                            "type": "string",
                            "analyzer": "autocomplete"
                        }
                    }
                },
                "category": {
                    "type": "string",
                    "analyzer": "symbols"
                },
                "href": {
                    "type": "string",
                    "analyzer": "symbols"
                },
                "description": {
                    "type": "string"
                },
                "first_name": {
                    "type": "string",
                    "fields": {
                        "raw": {
                            "type": "string",
                            "index": "not_analyzed"
                        }
                    }
                },
                "last_name": {
                    "type": "string",
                    "fields": {
                        "raw": {
                            "type": "string",
                            "index": "not_analyzed"
                        }
                    }
                },
                "institution": {
                    "type": "string",
                    "fields": {
                        "raw": {
                            "type": "string",
                            "index": "not_analyzed"
                        }
                    }
                },
                "position": {
                    "type": "string",
                    "fields": {
                        "raw": {
                            "type": "string",
                            "index": "not_analyzed"
                        }
                    }
                },
                "country": {
                    "type": "string",
                    "fields": {
                        "raw": {
                            "type": "string",
                            "index": "not_analyzed"
                        }
                    }
                },
                "state": {
                    "type": "string",
                    "fields": {
                        "raw": {
                            "type": "string",
                            "index": "not_analyzed"
                        }
                    }
                },
                "colleague_loci": {
                    "type": "string",
                    "fields": {
                        "raw": {
                            "type": "string",
                            "index": "not_analyzed"
                        },
                        "symbol": {
                            "type": "string",
                            "analyzer": "symbols"
                        }

                    }
                },
                "number_annotations": {
                    "type": "integer"
                },
                "feature_type": {
                    "type": "string",
                    "fields": {
                        "symbol": {
                            "type": "string",
                            "analyzer": "symbols"
                        },
                        "raw": {
                            "type": "string",
                            "index": "not_analyzed"
                        }
                    }
                },
                "name_description": {
                    "type": "string"
                },
                "summary": {
                    "type": "string"
                },
                "phenotypes": {
                    "type": "string",
                    "fields": {
                        "symbol": {
                            "type": "string",
                            "analyzer": "symbols"
                        }
                    }
                },
                "cellular_component": {
                    "type": "string",
                    "fields": {
                        "symbol": {
                            "type": "string",
                            "analyzer": "symbols"
                        },
                        "raw": {
                            "type": "string",
                            "index": "not_analyzed"
                        }
                    }
                },
                "biological_process": {
                    "type": "string",
                    "fields": {
                        "symbol": {
                            "type": "string",
                            "analyzer": "symbols"
                        },
                        "raw": {
                            "type": "string",
                            "index": "not_analyzed"
                        }
                    }
                },
                "molecular_function": {
                    "type": "string",
                    "fields": {
                        "symbol": {
                            "type": "string",
                            "analyzer": "symbols"
                        },
                        "raw": {
                            "type": "string",
                            "index": "not_analyzed"
                        }
                    }
                },
                "ec_number": {
                    "type": "string",
                    "analyzer": "symbols"
                },
                "protein": {
                    "type": "string",
                    "fields": {
                        "symbol": {
                            "type": "string",
                            "analyzer": "symbols"
                        }
                    }
                },
                "tc_number": {
                    "type": "string",
                    "analyzer": "symbols"
                },
                "secondary_sgdid": {
                    "type": "string",
                    "analyzer": "symbols"
                },
                "sequence_history": {
                    "type": "string",
                    "analyzer": "symbols"
                },
                "gene_history": {
                    "type": "string",
                    "analyzer": "symbols"
                },
                "bioentity_id": {
                    "type": "string",
                    "analyzer": "symbols"
                },
                "keys": {
                    "type": "string",
                    "analyzer": "symbols"
                },
                "status": {
                    "type": "string",
                    "analyzer": "symbols",
                    "fields": {
                        "raw": {
                            "type": "string",
                            "index": "not_analyzed"
                        }
                    }
                },
                "observable": {
                    "type": "string",
                    "fields": {
                        "symbol": {
                            "type": "string",
                            "analyzer": "symbols"
                        },
                        "raw": {
                            "type": "string",
                            "index": "not_analyzed"
                        }
                    }
                },
                "qualifier": {
                    "type": "string",
                    "fields": {
                        "symbol": {
                            "type": "string",
                            "analyzer": "symbols"
                        },
                        "raw": {
                            "type": "string",
                            "index": "not_analyzed"
                        }
                    }
                },
                "references": {
                    "type": "string",
                    "analyzer": "symbols",
                    "fields": {
                        "raw": {
                            "type": "string",
                            "index": "not_analyzed"
                        }
                    }
                },
                "phenotype_loci": {
                    "type": "string",
                    "fields": {
                        "raw": {
                            "type": "string",
                            "index": "not_analyzed"
                        },
                        "symbol": {
                            "type": "string",
                            "analyzer": "symbols"
                        }

                    }
                },
                "chemical": {
                    "type": "string",
                    "fields": {
                        "symbol": {
                            "type": "string",
                            "analyzer": "symbols"
                        },
                        "raw": {
                            "type": "string",
                            "index": "not_analyzed"
                        }
                    }
                },
                "mutant_type": {
                    "type": "string",
                    "fields": {
                        "symbol": {
                            "type": "string",
                            "analyzer": "symbols"
                        },
                        "raw": {
                            "type": "string",
                            "index": "not_analyzed"
                        }
                    }
                },
                "synonyms": {
                    "type": "string"
                },
                "go_id": {
                    "type": "string",
                    "analyzer": "symbols"
                },
                "go_loci": {
                    "type": "string",
                    "fields": {
                        "raw": {
                            "type": "string",
                            "index": "not_analyzed"
                        },
                        "symbol": {
                            "type": "string",
                            "analyzer": "symbols"
                        }

                    }
                },
                "author": {
                    "type": "string",
                    "analyzer": "symbols",
                    "fields": {
                        "raw": {
                            "type": "string",
                            "index": "not_analyzed"
                        }
                    }
                },
                "journal": {
                    "type": "string",
                    "analyzer": "symbols",
                    "fields": {
                        "raw": {
                            "type": "string",
                            "index": "not_analyzed"
                        }
                    }
                },
                "year": {
                    "type": "string",
                    "analyzer": "symbols",
                    "fields": {
                        "raw": {
                            "type": "string",
                            "index": "not_analyzed"
                        }
                    }
                },
                "reference_loci": {
                    "type": "string",
                    "analyzer": "symbols",
                    "fields": {
                        "raw": {
                            "type": "string",
                            "index": "not_analyzed"
                        }
                    }
                },
                "aliases": {
                        "type": "string",
                        "fields": {
                            "raw": {
                                "type": "string",
                                "index": "not_analyzed"
                            },
                            "symbol": {
                                "type": "string",
                                "analyzer": "symbols"
                            }

                        }
                   },
                "format": {
                        "type": "string",
                        "fields": {
                            "raw": {
                                "type": "string",
                                "index": "not_analyzed"
                            },
                            "symbol": {
                                "type": "string",
                                "analyzer": "symbols"
                            }

                        }
                   },
                "keyword": {
                        "type": "string",
                        "fields": {
                            "raw": {
                                "type": "string",
                                "index": "not_analyzed"
                            },
                            "symbol": {
                                "type": "string",
                                "analyzer": "symbols"
                            }

                        }
                   },
                "file_size": {
                        "type": "string",
                        "fields": {
                            "raw": {
                                "type": "string",
                                "index": "not_analyzed"
                            },
                            "symbol": {
                                "type": "string",
                                "analyzer": "symbols"
                            }

                        }
                   },
                "readme_url": {
                        "type": "string",
                        "fields": {
                            "raw": {
                                "type": "string",
                                "index": "not_analyzed"
                            },
                            "symbol": {
                                "type": "string",
                                "analyzer": "symbols"
                            }

                        }
                   },
                "topic": {
                        "type": "string",
                        "fields": {
                            "raw": {
                                "type": "string",
                                "index": "not_analyzed"
                            },
                            "symbol": {
                                "type": "string",
                                "analyzer": "symbols"
                            }

                        }
                   },
                "data": {
                        "type": "string",
                        "fields": {
                            "raw": {
                                "type": "string",
                                "index": "not_analyzed"
                            },
                            "symbol": {
                                "type": "string",
                                "analyzer": "symbols"
                            }

                        }
                   },
                "is_quick_flag": {
                        "type": "string",
                        "fields": {
                            "raw": {
                                "type": "string",
                                "index": "not_analyzed"
                            },
                            "symbol": {
                                "type": "string",
                                "analyzer": "symbols"
                            }

                        }
                   }



                }
            }
        }
}
